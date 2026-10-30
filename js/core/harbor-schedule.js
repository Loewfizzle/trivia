// CITY 2.0 — THE CITY TIMETABLE (NIGHT-B Group 1; the owner, Oct 29 4:54 pm + 9:11–9:15 pm — DECIDED): ONE place for WHEN things happen.
// Every row: an id, its TRIGGER — CLOCK (a time of day), CALENDAR (days / dates), DARKNESS (the light: the lamps' photocell, the windows at
// dusk), BEAT (the music's clock), EVENT (something else starts it: the blackout, the raid, a legendary) — when / how often / which days /
// its window / its rarity, what it must never overlap (CONFLICTS below), where it lives (`src`), and whether it's live or still planned.
// Only CLOCK + CALENDAR rows have times to tune (their `knobs`); the others record WHAT drives them, so the export shows the whole day.
//
// THE RULE (from NIGHT-B on): a NEW timed thing registers here and its planner READS its knobs (knob(id)); nothing new hard-codes a time.
// The older systems (sky events, legends, workers, boats, traffic, windows…) are listed as rows with `src` and migrate at SCHED.
// tests/harbor-tables.test.mjs. PURE.

export const TRIGGERS = Object.freeze(['clock', 'calendar', 'darkness', 'beat', 'event']);

/** hours are LOCAL hours of the evening's day (25 = 1 am, 26 = 2 am); durations in seconds unless named *_min */
export const SCHEDULE = Object.freeze([
  // ---- THE PARTY NIGHT (NIGHT-B — the owner, Oct 29 4:08 pm: "the street party crowd is there for the WHOLE party night")
  { id: 'party.night', trigger: 'calendar', status: 'live', src: 'core/party.js#partyHour', what: 'party nights: Friday + Saturday 8 pm → 2 am (+ the night before Thanksgiving)',
    knobs: { days: ['fri', 'sat'], from: 20, to: 26, probe: 22 } },   // (probe: the hour a night is asked "is it a party?")
  { id: 'party.crowd', trigger: 'clock', status: 'live', src: 'core/harbor-streetparty.js#crowdK', what: 'THE STREET PARTY crowd: grows through the warm-up, fullest at the peak, thins after 1 am, gone by 2',
    knobs: { warm: 20.5, full: 21.75, thin: 25.0, gone: 26.0, scan: [19.5, 26.5] } },   // (scan: the span its pockets' windows are read over)
  { id: 'party.songs', trigger: 'beat', status: 'live', src: 'core/harbor-streetparty.js#partySongs', what: 'THE PARTY\'S OWN SONG CLOCK: seeded songs back to back from 8 pm (every phone the same; a phone\'s own music may differ — the moves follow its beat)',
    knobs: { from: 20, to: 26.6, len: [185, 250], fast: 0.55 } },
  { id: 'party.break', trigger: 'beat', status: 'live', src: 'core/harbor-streetparty.js#danceBreaks', what: 'A DANCE BREAK ~every 20 min: ONE SONG where almost everyone dances, starting ON a party song\'s start (seeded)',
    knobs: { from: 21.0, to: 25.4, every_min: 20, jitter_min: 3, minGap_min: 12 }, conflicts: ['traffic.front', 'cabstand'] },
  { id: 'party.break.force', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#danceBreaks', what: '&force=dance — a dance break every 5 min (any night; &dance=conga|bounce|wands|swing|mix picks the kind)',
    knobs: { every: 300, first: 6, song: 210 } },
  { id: 'party.spill', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#spillPlan', what: 'INTO THE STREET: in a break the party steps down into the street\'s upper band; the front street\'s traffic holds',
    knobs: { lead: 14, trail: 16 }, conflicts: ['traffic.front'] },
  { id: 'party.bench', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js', what: 'DANCERS ON THE BENCH: in a break up to three climb onto the cab stand\'s bench', conflicts: ['cabstand'] },
  { id: 'party.conga', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#congaPlan', what: 'THE BIG CONGA: in a conga break a long line in from the right edge, across the whole promenade + off the left' },
  { id: 'cart.party', trigger: 'clock', status: 'live', src: 'core/harbor-routines.js#cartEvening', what: 'the chestnut cart PACKS UP before the party\'s crowd on a party night (any other night: VENDOR.to)',
    knobs: { partyTo: 20.4 } },
  { id: 'party.fireworks', trigger: 'clock', status: 'planned', src: 'Part 10', what: 'the party night\'s FIREWORKS at 10 pm (or once dark enough) + its biggest dance break; a small burst at midnight',
    knobs: { at: 22.0, midnight: 24.0 }, conflicts: ['storm'] },
  // ---- FIXED POINTS
  { id: 'rosie.bell', trigger: 'clock', status: 'live', fixed: true, src: 'core/harbor-boats.js', what: 'ROSIE\'s ship\'s bell as she docks at :00 (the horn ~:03 as she casts off) — the owner: NEVER moved',
    knobs: { minute: 0 } },
  // ---- THE REST OF THE CITY (rows to SEE the whole day; their times live in `src` until SCHED migrates them)
  { id: 'lamps', trigger: 'darkness', status: 'live', src: 'core/harbor-lamps.js', what: 'the implied lamps + the beacons: the photocell at dusk, off at dawn' },
  { id: 'windows.dusk', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js', what: 'the speakeasy\'s windows light at dusk; late at night they go out one by one' },
  { id: 'signs.modes', trigger: 'clock', status: 'live', src: 'core/harbor-roofmodes.js', what: 'the roof signs\' hourly modes (spell / race / breath)' },
  { id: 'party.pulse', trigger: 'beat', status: 'live', src: 'core/harbor-beat.js', what: 'the party pulse: the lights on the song\'s grid (a trusted grid always punches)' },
  { id: 'holidays', trigger: 'calendar', status: 'live', src: 'core/harbor-holiday.js', what: 'the holidays, their build-ups day by day + the sign dressings' },
  { id: 'workers', trigger: 'clock', status: 'live', src: 'core/harbor-workers.js', what: 'the workers\' day (milk 6:00, newsboy 7:00, barber 8:30, the beat cop 9 am + 9 pm…)' },
  { id: 'sky.events', trigger: 'clock', status: 'live', src: 'core/harbor-events.js', what: 'the everyday sky: planes, the helicopter (daily), balloons, birds… by rarity' },
  { id: 'helicopter.patrol', trigger: 'clock', status: 'planned', src: 'NIGHT-C', what: 'THE HELICOPTER PATROL: hourly dusk → ~2 am, every 2–3 h by day; up for every DANCE BREAK', conflicts: ['party.break'] },
  { id: 'boxer', trigger: 'calendar', status: 'planned', src: 'SKY', what: 'THE SHADOWBOXER: Mon / Wed / Fri 7 → 11 pm, sets of 10 rounds (Friday: he wraps up at 8:30 or trains on, seeded)', conflicts: ['window.party'] },
  { id: 'legendaries', trigger: 'event', status: 'live', src: 'core/harbor-legend.js', what: 'the legendaries (the UFO, the TR-3B…) — their seeded nights', conflicts: ['traffic'] },
  { id: 'blackout', trigger: 'event', status: 'live', src: 'core/harbor-dark.js', what: 'THE BLACKOUT (the TR-3B\'s drain): every light down, back on in turn' },
  { id: 'raid', trigger: 'event', status: 'live', src: 'core/harbor-raid.js', what: 'THE RAID: the night after a bootlegger delivery (~50 %), 9–11 pm', conflicts: ['party.break'] },
]);

/** THE CONFLICTS — what can never happen at the same time, in ONE place (the owner, 9:11 pm): `rule` = who gives way; `where` = the code */
export const CONFLICTS = Object.freeze([
  { a: 'legendaries', b: 'traffic', rule: 'no vehicle ENTERS during a legendary (one on screen finishes its business)', where: 'core/harbor-legend.js#trafficHold' },
  { a: 'party.break', b: 'traffic.front', rule: 'the front street holds its traffic for a dance break (the spill\'s lead → its trail): nothing enters, what\'s there drives on', where: 'core/harbor-streetparty.js#streetHold' },
  { a: 'party.break', b: 'cabstand', rule: 'no cab-stand waiter sits down in a break (the bench is the dancers\'); the taxi waits', where: 'core/harbor-streetparty.js#breakNear' },
  { a: 'raid', b: 'party.break', rule: 'no dance break while the raid runs (the break is skipped)', where: 'core/harbor-streetparty.js#danceBreaks (ctx.blocked)' },
  { a: 'legendaries', b: 'party.break', rule: 'no dance break during a legendary (skipped)', where: 'core/harbor-streetparty.js#danceBreaks (ctx.blocked)' },
  { a: 'helicopter.patrol', b: 'party.break', rule: 'the helicopter is UP for every dance break (NIGHT-C)', where: 'NIGHT-C' },
  { a: 'party.fireworks', b: 'storm', rule: 'no fireworks in a storm (Part 10)', where: 'Part 10' },
  { a: 'boxer', b: 'window.party', rule: 'the boxer\'s window sits out of the window party when he trains on a party night (SKY)', where: 'SKY' },
]);

const byId = new Map(SCHEDULE.map(r => [r.id, r]));
/** a row's knobs (throws on an unknown id — a typo never silently reads undefined) */
export function knob(id) {
  const r = byId.get(id);
  if (!r) throw new Error(`no timetable row "${id}" (core/harbor-schedule.js)`);
  return r.knobs || {};
}
export const scheduleRow = id => byId.get(id) || null;

const hh = h => { const x = ((h % 24) + 24) % 24, H = Math.floor(x), M = Math.round((x - H) * 60); return `${String(H === 24 ? 0 : H).padStart(2, '0')}:${String(M === 60 ? 0 : M).padStart(2, '0')}`; };
/** THE TIMETABLE, readable (the panel's TOOLS → THE CITY TIMETABLE, the pass logs, SCHED's input): every row — its trigger, its time
 *  knobs as clock times, its conflicts — then the conflicts table */
export function timetableText() {
  const fmt = r => {
    const k = r.knobs || {}, bits = [];
    for (const [n, v] of Object.entries(k)) bits.push(typeof v === 'number' && /^(from|to|warm|full|thin|gone|at|midnight|partyTo)$/.test(n) ? `${n} ${hh(v)}` : `${n} ${Array.isArray(v) ? v.join('/') : v}`);
    return `${r.trigger.toUpperCase().padEnd(8)} ${r.id.padEnd(18)} ${r.status === 'planned' ? '(planned) ' : ''}${r.fixed ? '(FIXED) ' : ''}${r.what}${bits.length ? ` — ${bits.join(' · ')}` : ''}${r.conflicts ? ` · never with: ${r.conflicts.join(', ')}` : ''}  [${r.src}]`;
  };
  const order = TRIGGERS;
  const rows = [...SCHEDULE].sort((a, b) => order.indexOf(a.trigger) - order.indexOf(b.trigger));
  return ['THE CITY TIMETABLE', ...rows.map(fmt), '', 'THE CONFLICTS', ...CONFLICTS.map(c => `${c.a} × ${c.b}: ${c.rule}  [${c.where}]`)].join('\n');
}
