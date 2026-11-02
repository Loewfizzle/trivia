// SCHED — THE GOLDEN TABLE: what every timed planner of City 2.0 decides over a whole year (seeded), for 2 time zones × 2 seeds, hashed
// per system per month. Written BEFORE a planner's timing knobs moved into THE CITY TIMETABLE (core/harbor-schedule.js); after the move the
// same export must match it EXACTLY (tests/harbor-sched-golden.test.mjs) — a move, never a behaviour change. Regenerated ONCE on purpose in
// SCHED's Group 3 (THE NEW SCHEDULE: the showcase's legendaries + medium tier — Nov 2) — never to hide a difference: node scripts/sched-golden.mjs --write
// PURE (node only, no DOM): the planners' own functions, the same calls the city makes (scene.js / windows.js / skyfx.js …).
import { createHash } from 'node:crypto';
import { legendNight, flybyDay, legendAt, legendsOf } from '../../js/core/harbor-legend.js';
import { legendsTonight, mediumDay } from '../../js/core/harbor-showcase.js';
import { soloDay } from '../../js/core/harbor-blackbird.js';
import { mothmanNight } from '../../js/core/harbor-mothman.js';
import { patrolDay } from '../../js/core/harbor-heli.js';
import { createScheduler, HARBOR_EVENTS, SLOT_MS } from '../../js/core/harbor-events.js';
import { workDay, bulbOut, lampFault, boardLampOut, bootlegNight, dayOf } from '../../js/core/harbor-workers.js';
import { dayPlan, edgeMoods, edgeShades, bossDayPlan, parkedNight, quietNight, bedtimes, windowParty, eyesNights, legendNights } from '../../js/core/harbor-moments.js';
import { scenesTonight, shadesNight } from '../../js/core/harbor-scenes.js';
import { boxerNight } from '../../js/core/harbor-boxer.js';
import { holidayAt, ghostShipTimes, processionAt, GHOST_LEN } from '../../js/core/harbor-holiday.js';
import { towerAt } from '../../js/core/harbor-tower.js';
import { xmasPrelude } from '../../js/core/harbor-xmas.js';
import { paradeWindow } from '../../js/core/harbor-parade.js';
import { raidEvening, RAID } from '../../js/core/harbor-raid.js';
import { cabEvents, standEvents } from '../../js/core/harbor-cabs.js';
import { FOLK } from '../../js/core/harbor-people.js';
import { laneSpawns, TRAFFIC } from '../../js/core/harbor-traffic.js';
import { owlDay, heronMorning, pigeonSlot, gullSlot, squirrelSlot, fireflyCount, pigeonCount, groundShare, PIGEON, GULL, SQUIRREL } from '../../js/core/harbor-wildlife.js';
import { danceSlot, cartEvening } from '../../js/core/harbor-routines.js';
import { lampMoment } from '../../js/core/harbor-lamps.js';
import { roofModes } from '../../js/core/harbor-roofmodes.js';
import { fireworksNight } from '../../js/core/harbor-fireworks.js';
import { danceBreaks, partyNight, crowdK } from '../../js/core/harbor-streetparty.js';
import { mixNow, jogHour, dogOffset, roofCrowd } from '../../js/core/harbor-people.js';
import { totGroups, procWindow } from '../../js/core/harbor-holidayfolk.js';
import { witchAt, batColonyAt } from '../../js/core/harbor-ghost.js';
import { roadBusy } from '../../js/core/harbor-promenade.js';
import { sunPosition } from '../../js/core/sky.js';

export const ZONES = Object.freeze([{ tz: 'America/Detroit', lat: 42.96, lon: -85.67 }, { tz: 'Europe/Berlin', lat: 52.52, lon: 13.4 }]);
export const SEEDS = Object.freeze([1924, 7]);
export const YEAR = Object.freeze({ from: '2026-11-01', days: 365 });

const pad = n => String(n).padStart(2, '0');
/** the zone's UTC offset (minutes, east positive — the city's `off`) at abs ms */
function offAt(tz, ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).filter(x => x.type !== 'literal').map(x => [x.type, +x.value]));
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000);
}
/** the days of the golden year in a zone: { y, m, d, key (padded), wkey (the workers' unpadded), day0 (abs s local midnight), off, dow } */
export function goldenDays(zone, days = YEAR.days) {
  const [Y, M, D] = YEAR.from.split('-').map(Number), out = [];
  for (let i = 0; i < days; i++) {
    const u = new Date(Date.UTC(Y, M - 1, D + i)), y = u.getUTCFullYear(), m = u.getUTCMonth() + 1, d = u.getUTCDate();
    const noonUtc = Date.UTC(y, m - 1, d, 12), off = offAt(zone.tz, noonUtc), day0 = Math.round(Date.UTC(y, m - 1, d) / 1000 - off * 60);
    out.push({ y, m, d, key: `${y}-${pad(m)}-${pad(d)}`, wkey: `${y}-${m}-${d}`, day0, off, dow: u.getUTCDay(), i });
  }
  return out;
}
const lcOf = (D, h) => ({ y: D.y, m: D.m, d: D.d, h: Math.floor(h), mi: Math.round((h % 1) * 60), s: 0, off: D.off });
/** the windows the sky is held for on an evening (its legendary, the ghost ship, the raid) — scene-fireworks.js#fwNightOf's own */
function fwHeld(D, seed) {
  const held = [];
  for (const lg of legendsOf(D.y, D.m, D.d)) held.push([D.day0 + lg.h * 3600, D.day0 + lg.h * 3600 + lg.len]);   // (SCHED: scene-fireworks.js#fwNightOf — every one of tonight's)
  if (D.m === 10 && D.d === 31) for (const h of ghostShipTimes(D.y)) held.push([D.day0 + h * 3600, D.day0 + h * 3600 + GHOST_LEN]);
  try { const rd = raidEvening(D.key, { off: D.off, seed, day0: D.day0 }); if (rd) held.push([rd.t0 - 30, rd.t0 + RAID.cap]); } catch { /* fine */ }
  return (a, b) => { let e = null; for (const [p, q] of held) if (b > p && a < q) e = Math.max(e == null ? q : e, q); return e; };
}
function darkAt(D, zone, el = -7.5) {
  for (let tt = D.day0 + 16 * 3600; tt < D.day0 + 26 * 3600; tt += 600) if (sunPosition(tt * 1000, zone.lat, zone.lon).el <= el) {
    let lo = tt - 600, hi = tt; for (let i = 0; i < 8; i++) { const mm = (lo + hi) / 2; if (sunPosition(mm * 1000, zone.lat, zone.lon).el <= el) hi = mm; else lo = mm; }
    return Math.round(hi);
  }
  return null;
}
/** a stand-in set of the wildlife's spots (the real ones need the layout; only their ids + kinds + caps steer the draw) */
const WILD_SPOTS = [{ id: 'blade', kind: 'ledge', who: ['pigeon'], cap: 3, x: 0, y: 6, z: 20 }, { id: 'parapetR', kind: 'ledge', who: ['pigeon'], cap: 4, x: 10, y: 8, z: 20 },
  { id: 'bill', kind: 'ledge', who: ['pigeon', 'gull'], cap: 3, x: 20, y: 7, z: 22 }, { id: 'catwalk', kind: 'ledge', who: ['pigeon'], cap: 2, x: 30, y: 5, z: 22 },
  { id: 'patch', kind: 'ground', who: ['pigeon'], cap: 8, x0: 0, x1: 12, y: 0, z: 14 }];
const SAMPLE = D => D.d === 1 || D.d === 11 || D.d === 21;   // (the block-by-block planners: three days a month, whole)

/** every system: (D, zone, seed) → a JSON-able value (null / [] = nothing that day). Per-month systems run on the 1st only. */
export const SYSTEMS = {
  'legend.night': D => legendNight(D.y, D.m, D.d),
  'legend.at': D => [20, 21.5, 22.5, 23.5].map(h => { const x = legendAt(lcOf(D, h)); return x ? [x.kind, Math.round(x.s)] : null; }),
  'legend.flyby': D => flybyDay(D.y, D.m, D.d, 18.5),
  'legend.tango': D => (D.m === 1 && D.d === 1 ? legendNights(D.y) : undefined),
  'blackbird.solo': (D, z, seed) => soloDay(D.day0 + 43200, D.off, seed),
  'mothman': D => mothmanNight(D.y, D.m, D.d),
  'helicopter.patrol': (D, z, seed) => patrolDay(D.day0 + 12 * 3600, D.off, tt => sunPosition(tt * 1000, z.lat, z.lon).el, seed),
  'sky.events': (D, z, seed) => { if (D.i % 3) return undefined;
    const S = createScheduler(HARBOR_EVENTS, t => { const sp = sunPosition(t, z.lat, z.lon); return { ms: t, force: new Set(), night: sp.el < -6, el: sp.el, az: sp.az, month: new Date(t).getUTCMonth() + 1, south: false, heli: () => false }; }, { seed, anchor: (D.day0 - 86400) * 1000 });
    const seen = new Map(); for (let ms = D.day0 * 1000; ms < (D.day0 + 86400) * 1000; ms += SLOT_MS) for (const e of S.at(ms).active) if (!seen.has(`${e.id}|${e.start}`)) seen.set(`${e.id}|${e.start}`, [e.id, e.start, e.end]);
    return [...seen.values()]; },
  'workers.day': (D, z, seed) => workDay(D.wkey, { seed, day0: D.day0, off: D.off }),
  'workers.faults': (D, z, seed) => [bulbOut(D.wkey, D.day0, { seed }), lampFault(D.wkey, D.day0, { seed }), boardLampOut(D.wkey, D.day0, { seed }), bootlegNight(D.wkey, { seed })],
  'windows.day': (D, z, seed) => (SAMPLE(D) ? dayPlan(D.key, { seed }) : undefined),
  'windows.night': (D, z, seed) => [edgeMoods(D.key, {}), edgeShades(D.key, { seed }), parkedNight(D.key, { seed }), quietNight(D.key, { seed }), bedtimes(D.key, { seed }), windowParty(D.key, { seed })],
  'windows.boss': (D, z, seed) => bossDayPlan(D.key, { seed }),
  'windows.eyes': D => (D.d === 1 ? eyesNights(D.y, D.m) : undefined),
  'scenes': (D, z, seed) => { const sc = scenesTonight(D.key, { seed }); return [sc, shadesNight(D.key, { seed, scenes: sc })]; },   // (SCHED: they play on through the legendaries — windows.js)
  'boxer': (D, z, seed) => boxerNight(D.key, { seed }),
  'showcase.legends': D => ['high', 'normal', 'low'].map(lv => legendsTonight(D.y, D.m, D.d, lv)),
  'showcase.medium': D => (SAMPLE(D) ? mediumDay(D.wkey, D.day0, D.dow) : undefined),
  'holiday': D => [12, 21].map(h => { const x = holidayAt(lcOf(D, h)); return x ? JSON.parse(JSON.stringify(x)) : null; }),
  'holiday.ghost': D => (D.d === 1 && D.m === 1 ? ghostShipTimes(D.y) : undefined),
  'holiday.procession': D => processionAt(lcOf(D, 20), 17.6),
  'tower': D => towerAt(lcOf(D, 12)),
  'xmas': D => xmasPrelude(lcOf(D, 18), { dusk: 17 }),
  'parade': D => paradeWindow(D.day0 + 10 * 3600, { off: D.off }),
  'raid': (D, z, seed) => raidEvening(D.key, { seed, off: D.off, day0: D.day0 }),
  'cabs': (D, z, seed) => (SAMPLE(D) ? Array.from({ length: 180 }, (_, j) => { const k = Math.floor(D.day0 / FOLK.block) + j; return [cabEvents(k, { seed, off: D.off }), standEvents(k, { seed, off: D.off })]; }) : undefined),
  'traffic': (D, z, seed) => (SAMPLE(D) ? Array.from({ length: 720 }, (_, j) => ['near', 'far', 'back'].map(l => laneSpawns(Math.floor(D.day0 / TRAFFIC.block) + j, l, { seed, off: D.off }))) : undefined),
  'wildlife.day': (D, z, seed) => [owlDay(D.key, D.day0, { seed, off: D.off, sun: { rise: 7, set: 18 } }), heronMorning(D.key, D.day0, { seed, off: D.off, sun: { rise: 7, set: 18 } })],
  'wildlife.slots': (D, z, seed) => (SAMPLE(D) ? Array.from({ length: 48 }, (_, j) => { const t = D.day0 + j * 1800; const c = { seed, off: D.off, sun: { rise: 7, set: 18 }, spots: WILD_SPOTS }; return [pigeonSlot(Math.floor(t / PIGEON.slot), c), gullSlot(Math.floor(t / GULL.slot), c), squirrelSlot(Math.floor(t / SQUIRREL.slot), c)]; }) : undefined),
  'wildlife.counts': D => (D.d === 1 ? Array.from({ length: 24 }, (_, h) => [pigeonCount({ h, dow: D.dow, month: D.m }), groundShare({ h, month: D.m }), fireflyCount({ h, month: D.m, day: 15 })]) : undefined),
  'routines': (D, z, seed) => [cartEvening(D.wkey, D.m, D.day0, -40, 10, { seed, party: D.dow === 5 || D.dow === 6 }), SAMPLE(D) ? Array.from({ length: 24 }, (_, j) => danceSlot(Math.floor(D.day0 / 3600) + j, { seed, off: D.off })) : null],
  'lamps': (D, z, seed) => (SAMPLE(D) ? Array.from({ length: 24 }, (_, j) => lampMoment((D.day0 + j * 3600) * 1000, 12, { seed })) : undefined),
  'roofmodes': D => (SAMPLE(D) ? Array.from({ length: 24 }, (_, j) => [...roofModes(['a', 'b', 'c', 'd', 'e'], Math.floor(D.day0 / 3600) + j)].map(x => x.join(':'))) : undefined),
  'fireworks': (D, z, seed) => fireworksNight(D.day0, D.key, { party: partyNight(D.day0, { off: D.off }), dark: darkAt(D, z), busy: fwHeld(D, seed) }),
  'party.breaks': (D, z, seed) => (partyNight(D.day0, { off: D.off }) ? danceBreaks(D.day0, D.key, { off: D.off, seed }) : null),
  'people.mix': D => (D.d === 1 ? Array.from({ length: 24 }, (_, h) => [mixNow({ h, dow: D.dow }), mixNow({ h, dow: 6, party: true }), jogHour(h, D.dow % 6 === 0), dogOffset(D.m, h), roofCrowd({ h, dow: D.dow, month: D.m }), crowdK(h + 0.5), roadBusy(h)]) : undefined),
  'holidayfolk': (D, z, seed) => (D.m === 10 && D.d >= 30 || D.m === 11 && D.d <= 2 ? [Array.from({ length: 48 }, (_, j) => totGroups(Math.floor(D.day0 / 600) + 100 + j, { seed, off: D.off })), procWindow(D.day0 + 20 * 3600, { off: D.off })] : undefined),
  'ghost.sky': D => (D.m === 10 ? [19, 20, 21, 22].map(h => [witchAt(lcOf(D, h), 1), batColonyAt(lcOf(D, h), 1, 17.6)]) : undefined),
};

const round = v => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
const canon = v => JSON.stringify(v, (k, x) => (x instanceof Map ? [...x] : x instanceof Set ? [...x] : typeof x === 'function' ? undefined : round(x)));
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 16);

/** the golden table: { system: { 'zone|seed|YYYY-MM': hash } } (+ the errors, so a planner that throws is a difference too) */
export function goldenTable(only = null, days = YEAR.days) {
  const out = {};
  for (const zone of ZONES) {
    const DAYS = goldenDays(zone, days);
    for (const seed of SEEDS) for (const [id, fn] of Object.entries(SYSTEMS)) {
      if (only && !only.includes(id)) continue;
      const months = new Map();
      for (const D of DAYS) {
        let v; try { v = fn(D, zone, seed); } catch (e) { v = { error: String(e && e.message) }; }
        if (v === undefined) continue;
        const mk = `${zone.tz}|${seed}|${D.y}-${pad(D.m)}`;
        if (!months.has(mk)) months.set(mk, []);
        months.get(mk).push(`${D.key}:${canon(v)}`);
      }
      out[id] = out[id] || {};
      for (const [mk, rows] of months) out[id][mk] = sha(rows.join('\n'));
    }
  }
  return out;
}
/** a system's raw values for one zone + seed (to look at a difference) */
export function goldenRaw(id, zoneIx = 0, seed = SEEDS[0], days = YEAR.days) {
  const zone = ZONES[zoneIx];
  return goldenDays(zone, days).map(D => { let v; try { v = SYSTEMS[id](D, zone, seed); } catch (e) { v = { error: String(e && e.message) }; } return v === undefined ? null : `${D.key}:${canon(v)}`; }).filter(Boolean);
}
