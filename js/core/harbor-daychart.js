// CITY 2.0 — THE DAY CHART (SCHED Group 5; the owner, Nov 1–2: "both — a page on my phone + the same chart in the admin panel"): what the
// city does on a day, hour by hour, + a YEAR VIEW of the rare things per month — built FROM THE TIMETABLE + THE PLANNERS (the same code the
// city runs; never a hand-made list). PURE (no DOM): js/daychart/daychart.js draws it (/daychart + /admin, admins only — the legendaries'
// times are a spoiler). Also THE 30-SECOND RULE's sampler: in prime time no 30-s window with nothing moving in view (quietWindows).
import { knob, scheduleRow } from './harbor-schedule.js';
import { legendsTonight, mediumDay, showcaseLevel, showcaseOf } from './harbor-showcase.js';
import { patrolDay } from './harbor-heli.js';
import { workDay } from './harbor-workers.js';
import { scenesTonight, shadesNight } from './harbor-scenes.js';
import { MOMENT, SHADE_LEN } from './harbor-moments.js';
import { boxerNight } from './harbor-boxer.js';
import { fireworksNight, fireworksWeather } from './harbor-fireworks.js';
import { partyNight, danceBreaks } from './harbor-streetparty.js';
import { raidEvening, RAID } from './harbor-raid.js';
import { hintsAt } from './harbor-billboard.js';
import { holdemShow, holdemKeeps } from './harbor-holdem.js';
import { holidayAt, ghostShipTimes, GHOST_LEN } from './harbor-holiday.js';
import { paradeWindow } from './harbor-parade.js';
import { mixNow } from './harbor-people.js';
import { sunPosition } from './sky.js';

const pad = n => String(n).padStart(2, '0');
/** THE CITY's OWN DAY (the owner's SCHED review — a FULL 24 HOURS): 4 am → 4 am the next morning (local hours on the day's clock) */
export const DAY_FROM = 4, DAY_TO = 28;
const NAMES = Object.freeze({ ufo: 'THE UFO ABDUCTION', tr3b: 'THE TR-3B + THE JET CHASE', flyby: 'THE SURPRISE FLYBY', blackbird: 'THE BLACKBIRD' });
const WORKER_NAMES = Object.freeze({ newsdrop: 'The newspaper van', newsboy: 'The newsboy', evening: 'The evening edition', barber: 'The barber opens', cop: 'The beat cop', patrol: 'The beat cop’s night round',
  mail: 'The mailman', bartender: 'The bartender arrives', doorman: 'The doorman', flowers: 'The flower seller', musician: 'The musician', staff: 'The staff lock up', henchman: 'The henchman’s night shift',
  henchman2: 'The henchman’s late round', sweeper: 'The street sweeper', milk: 'The milk truck', trash: 'The trash truck', ice: 'The ice man', washers: 'THE WINDOW WASHERS', gardener: 'The rooftop gardener',
  soda: 'The SODA WATER truck', painters: 'THE SIGN PAINTERS', billposter: 'The billposter (today’s game)', bootleg: 'The bootleggers (a quiet truck)', delivery: 'THE BIG DELIVERY', bulb: 'The bulb repairman',
  sweep2: 'The extra sweep', crew: 'The cleanup crew', hydrant: 'THE HYDRANT opened', xlights: 'THE FIRST CHRISTMAS CREW', hoser: 'The water wagon', raker: 'The leaf raker' });
const SCENE_NAMES = Object.freeze({ juggler: 'THE JUGGLER', crate: 'THE CRATE GUY', charleston: 'THE CHARLESTON', bookie: 'THE BOOKIE' });
/** a local hour as a clock ("9:30 pm", "12:05 am") */
export function clockOf(h) { const x = ((h % 24) + 24) % 24, H = Math.floor(x), M = Math.round((x - H) * 60) % 60, hh = H % 12 || 12; return `${hh}:${pad(M)} ${H < 12 ? 'am' : 'pm'}`; }

/**
 * THE DAY: dateKey 'YYYY-MM-DD' (local), o: { off (the zone's minutes east), lat, lon, seed, level, wx: { storm, rain, snow, wind, fog } }
 * → { key, dow, party, level, holiday, items: [{ cat, h0, h1 (local hours on the day's clock: 25 = 1 am the next morning), label, big? }],
 *     summary: [lines] }
 */
export function dayChart(dateKey, o = {}) {
  const [y, m, d] = dateKey.split('-').map(Number), off = o.off || 0, seed = o.seed || 1924, lv = o.level || showcaseLevel(), lat = o.lat ?? 42.96, lon = o.lon ?? -85.67;
  const key = `${y}-${pad(m)}-${pad(d)}`, wkey = `${y}-${m}-${d}`, dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), day0 = Math.round(Date.UTC(y, m - 1, d) / 1000 - off * 60);
  const H = t => (t - day0) / 3600, items = [], add = (cat, h0, h1, label, big = false, x = null) => items.push({ cat, h0: +h0.toFixed(3), h1: +h1.toFixed(3), label, big, ...(x || {}) });
  const party = partyNight(day0, { off }), wx = o.wx || {};
  // THE LEGENDARIES (the showcase's list — their minutes)
  const L = legendsTonight(y, m, d, lv);
  for (const x of L) add('legendary', x.h, x.h + x.len / 3600, NAMES[x.kind] || x.kind.toUpperCase(), true);
  // THE MEDIUM TIER (the scheduled plane passes + THE BLACK HELICOPTER — FRIENDS C: the medium tier's night helicopter pass is it)
  for (const e of mediumDay(wkey, day0, dow, { level: lv })) if (e.kind === 'plane') add('medium', H(e.t), H(e.t) + 40 / 3600, 'An airliner crossing');
  // THE PATROL (the helicopter's own timetable)
  const elAt = t => sunPosition(t * 1000, lat, lon).el;
  for (const f of patrolDay(day0 + 12 * 3600, off, elAt, seed)) add(f.medium ? 'medium' : 'sky', H(f.t0), H(f.t0 + f.dur), f.medium ? 'THE BLACK HELICOPTER (the medium tier)' : f.night ? 'The helicopter patrol (its searchlight)' : 'The helicopter patrol');
  // THE WORKERS' DAY (the shows + the regulars)
  for (const w of workDay(wkey, { seed, day0, off })) add('workers', H(w.t0), H(w.t1 || w.t0 + 300), WORKER_NAMES[w.kind] || `The ${w.kind.replace(/\d+$/, '')}`);
  // THE WINDOWS (the scenes + the shadowboxer)
  // (THE VAULT 1B add-on — THE PROGRAM's RARE tag: a scene the timetable gives under half the nights — its `p` — is RARE)
  const rareOf = id => { try { const r = scheduleRow(`scene.${id}`); const p = r && r.knobs && r.knobs.p; return p != null && p < 0.5; } catch { return false; } };
  for (const sc of scenesTonight(key, { seed })) add('windows', sc.start / 3600, sc.end / 3600, SCENE_NAMES[sc.id] || sc.id, false, { id: sc.id, rare: rareOf(sc.id) });
  { const bx = boxerNight(key, { seed }), P = knob('boxer'); if (bx.on) add('windows', P.from, bx.party && !bx.stay ? P.wrapAt : P.to, 'THE SHADOWBOXER'); }
  // THE SMALL HOURS (the owner's SCHED review: "every hour, the small hours included"): the boss's blue TV from his lights-out to 3 am, his
  // shade pull + the nightlight, the scene rooms' LIGHTS OUT one at a time (~2–4 am), the edge windows' with them
  { const lo = MOMENT['lights-out'].at; add('windows', lo, 27, 'THE BOSS’s BLUE TV (his room)');
    add('windows', 27, 27 + SHADE_LEN / 3600, 'THE BOSS pulls his shade (the nightlight till dawn)');
    const ROOM = { bar: 'the bottom middle', jazz: 'the bottom right', back: 'the top middle', edge2: 'an edge window', edge3: 'an edge window' };
    const outs = shadesNight(key, { seed, scenes: scenesTonight(key, { seed }) });
    for (const [id, s] of Object.entries(outs)) add('windows', s / 3600, s / 3600 + 1 / 60, `LIGHTS OUT — ${ROOM[id] || id}’s shade goes dark`); }
  // THE PARTY (Fri + Sat) + its dance breaks
  if (party) {
    const N = knob('party.night'); add('party', N.from, N.to, 'THE STREET PARTY');
    for (const b of danceBreaks(day0, key, { off, seed })) add('party', H(b.s0), H(b.s1), `A DANCE BREAK (${b.kind})`);
  }
  // THE FIREWORKS (the weather may call them off) — they wait for tonight's legendaries
  { const held = L.map(x => [day0 + x.h * 3600, day0 + x.h * 3600 + x.len]);
    const busy = (a, b) => { let e = null; for (const [p, q] of held) if (b > p && a < q) e = Math.max(e == null ? q : e, q); return e; };
    const darkT = (() => { for (let tt = day0 + 16 * 3600; tt < day0 + 26 * 3600; tt += 600) if (elAt(tt) <= knob('fireworks.show').darkEl) return tt; return null; })();
    const fw = fireworksWeather(wx);
    for (const s of fireworksNight(day0, key, { party, dark: darkT, busy })) add('fireworks', H(s.t0), H(s.t1), `${s.kind === 'party' ? 'THE PARTY SHOW' : s.kind === 'show' ? 'THE FIREWORKS' : 'MIDNIGHT’s few shells'}${fw.ok ? '' : ` — CALLED OFF (${fw.why})`}`, s.kind !== 'midnight'); }
  // THE RAID
  { const rd = raidEvening(key, { seed, off, day0 }); if (rd) add('raid', H(rd.t0), H(rd.t0 + RAID.cap), 'THE RAID (the convoy, the lights cut)', true); }
  // THE HOLIDAYS (the day's state, the ghost ship, the parade)
  const hol = holidayAt({ y, m, d, h: 20, mi: 0, s: 0 });
  if (m === 10 && d === 31) for (const gh of ghostShipTimes(y)) add('holiday', gh, gh + GHOST_LEN / 3600, 'THE GHOST SHIP', true, { legend: true });   // (THE VAULT 1C: a legendary sighting — its tier on THE PROGRAM)
  { const pw = paradeWindow(day0 + 12 * 3600, { off }); if (pw) add('holiday', H(pw.T0), H(pw.T1), 'THE THANKSGIVING PARADE', true); }
  // THE BILLBOARD's hints (each one's window — it shows its spell every few minutes inside it)
  { const seen = new Map(); for (let q = DAY_FROM * 4; q < DAY_TO * 4; q++) { const hh = q / 4, lc = hh < 24 ? { y, m, d, h: Math.floor(hh), mi: (hh % 1) * 60, s: 0 } : (() => { const p = new Date(Date.UTC(y, m - 1, d) + 864e5); return { y: p.getUTCFullYear(), m: p.getUTCMonth() + 1, d: p.getUTCDate(), h: Math.floor(hh - 24), mi: ((hh - 24) % 1) * 60, s: 0 }; })();
      for (const x of hintsAt(lc, { level: lv })) { const k = `${x.id}|${x.lines.join(' ')}`, e = seen.get(k); if (e && e.h1 >= hh - 0.25) e.h1 = hh + 0.25; else { const it = { cat: 'billboard', h0: hh, h1: hh + 0.25, label: `THE BILLBOARD: ${x.lines.join(' / ')}`, big: false }; seen.set(k, it); items.push(it); } } } }
  // CITY FIXES + HOLD'EM — THE BASE POSTER: the roof board shows HOLD'EM instead of the day's game (the board turns over at the billposter's
  // ~5 pm paste — none while it keeps HOLD'EM); the hints above still take their spells over it
  { const hs = holdemShow(key); if (hs) items.push({ cat: 'billboard', h0: DAY_FROM, h1: DAY_TO, label: `THE BILLBOARD's BASE POSTER: TEXAS HOLD’EM · ${hs === 'holdem-open' ? 'NOW OPEN' : 'COMING SOON'}${holdemKeeps(key) ? ' (no billposter today)' : ' (pasted at ~5 pm)'}`, big: false }); }
  items.sort((a, b) => a.h0 - b.h0 || (b.big - a.big));
  const summary = [
    `${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dow]} ${key}${party ? ' · A PARTY NIGHT' : ''}${hol && hol.id ? ` · ${hol.label}` : ''} · THE SHOWCASE ${lv.toUpperCase()}`,
    L.length ? `${L.length} legendar${L.length === 1 ? 'y' : 'ies'}: ${L.map(x => `${NAMES[x.kind] || x.kind} ${clockOf(x.h)}`).join(' · ')}` : 'No legendaries tonight',
    `${items.filter(i => i.cat === 'medium').length} medium moments · ${items.filter(i => i.cat === 'workers').length} workers · ${items.filter(i => i.cat === 'sky').length} patrols`,
  ];
  return { key, dow, party, level: lv, holiday: hol && hol.id ? hol.label : null, items, summary };
}

/** THE 30-SECOND RULE (the owner: "something moving in any 30 s"): the 30-s windows of [from, to] (local hours) with nothing moving in view
 *  at a phone's width — the people on the promenade (the day's mix), the window scenes, the shadowboxer, the boats' hourly visit, the
 *  medium + the legendaries + the patrol → [[h0, h1]…] (expected: none in prime time) */
export function quietWindows(dateKey, o = {}, from = 18, to = 23) {
  const C = dayChart(dateKey, o), [y, m, d] = dateKey.split('-').map(Number), dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), out = [];
  const movers = C.items.filter(i => ['windows', 'legendary', 'medium', 'sky', 'party', 'fireworks', 'raid', 'workers'].includes(i.cat));
  for (let h = from; h < to; h += 30 / 3600) {
    const people = mixNow({ h: h % 24, dow, party: C.party, rain: (o.wx && o.wx.rain) || 0 }).n >= 1;
    const any = people || movers.some(i => i.h0 < h + 30 / 3600 && i.h1 > h);
    if (!any) out.push([+h.toFixed(4), +(h + 30 / 3600).toFixed(4)]);
  }
  return out;
}

/** THE YEAR VIEW (at a dial level): per month, how often each rare thing comes — the legendaries by kind, the raids, the party nights, the
 *  bootleggers' quiet runs, the ghost ship, the parade → { months: [{ m, counts: { … } }], totals } */
export function yearView(year, o = {}) {
  const lv = o.level || showcaseLevel(), seed = o.seed || 1924, months = [], totals = {};
  for (let m = 1; m <= 12; m++) {
    const counts = {}, inc = (k, n = 1) => { counts[k] = (counts[k] || 0) + n; totals[k] = (totals[k] || 0) + n; };
    const dim = new Date(Date.UTC(year, m, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      for (const x of legendsTonight(year, m, d, lv)) inc(NAMES[x.kind] || x.kind);
      const key = `${year}-${pad(m)}-${pad(d)}`, day0 = Math.round(Date.UTC(year, m - 1, d) / 1000 + 300 * 60);
      if (partyNight(day0, { off: -300 })) inc('PARTY NIGHTS');
      if (raidEvening(key, { seed, off: -300, day0 })) inc('THE RAID');
      if (workDay(`${year}-${m}-${d}`, { seed, day0, off: -300 }).some(w => w.kind === 'bootleg')) inc('THE BOOTLEGGERS');
    }
    if (m === 10) inc('THE GHOST SHIP', ghostShipTimes(year).length);
    if (m === 11) inc('THE THANKSGIVING PARADE');
    months.push({ m, counts });
  }
  return { year, level: lv, months, totals, perVisit: showcaseOf(lv) };
}
