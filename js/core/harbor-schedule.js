// CITY 2.0 — THE CITY TIMETABLE (NIGHT-B Group 1; the owner, Oct 29 4:54 pm + 9:11–9:15 pm — DECIDED): ONE place for WHEN things happen.
// Every row: an id, its TRIGGER — CLOCK (a time of day), CALENDAR (days / dates), DARKNESS (the light: the lamps' photocell, the windows at
// dusk), BEAT (the music's clock), EVENT (something else starts it: the blackout, the raid, a legendary) — when / how often / which days /
// its window / its rarity, what it must never overlap (CONFLICTS below), where it lives (`src`), and whether it's live or still planned.
// Only CLOCK + CALENDAR rows have times to tune (their `knobs`); the others record WHAT drives them, so the export shows the whole day.
//
// THE RULE (from NIGHT-B on): a NEW timed thing registers here and its planner READS its knobs (knob(id)); nothing hard-codes a time.
// SCHED (Nov 2) MOVED EVERY OLDER SYSTEM IN (the sky events, the legends, the workers, the people, the windows, the holidays, boats, traffic,
// the cabs, the raid, the wildlife, the routines, the tower, the parade, Christmas, the lamps, the signs, the snow crews) — proved by THE
// GOLDEN TABLE (tests/fixtures/sched-golden.mjs: a year of every planner's decisions, unchanged) + tests/harbor-sched-strays.test.mjs (no
// stray time left in a planner).
// tests/harbor-tables.test.mjs. PURE.

export const TRIGGERS = Object.freeze(['clock', 'calendar', 'darkness', 'beat', 'event']);

/** hours are LOCAL hours of the evening's day (25 = 1 am, 26 = 2 am); durations in seconds unless named *_min */
export const SCHEDULE = Object.freeze([
  // ---- THE PARTY NIGHT (NIGHT-B — the owner, Oct 29 4:08 pm: "the street party crowd is there for the WHOLE party night")
  { id: 'party.night', jack: { id: 'party', label: 'PARTY', order: 7, card: 'fire', dark: true, len: 900, lane: 'free', start: 'hold:party', note: 'the street party + its neon, now (15 min)' }, trigger: 'calendar', status: 'live', src: 'core/party.js#partyHour', what: 'party nights: Friday + Saturday 8 pm → 2 am (+ the night before Thanksgiving)',
    knobs: { days: ['fri', 'sat'], from: 20, to: 26, probe: 22 } },   // (probe: the hour a night is asked "is it a party?")
  // ---- SCHED — THE SHOWCASE (the owner, Nov 2 — DECIDED; core/harbor-showcase.js): ONE DIAL for how much of the city's rare stuff a visitor
  // catches — `level` HIGH now (the server's city2/live overrides it for everyone; a preview's &showcase=) → each level: THE LEGENDARIES
  // (weeknight [min, max] in the prime span primeFrom → primeTo; a party night one an hour from partyFrom, up to partyMax; ≥ gap h apart;
  // tr3bWeeknight: the TR-3B on weeknights too, after dark; bbLunch: the Blackbird's odds of a lunchtime pass) + THE MEDIUM TIER (perHour at
  // the prime-time peak). legendPad: the hours kept clear round a legendary (the fireworks, the medium moments). THE FEASIBILITY CHECK (the owner
  // chose "keep the counts"): a 45-s prime-time visit catches a legendary ~1 in 85 on a weeknight, ~1 in 55 on a party night at HIGH
  // (scripts/sim-sched.mjs) — it rises by itself as new legendaries join the pool (a row with knobs.pool)
  { id: 'showcase', trigger: 'event', status: 'live', src: 'core/harbor-showcase.js', what: 'THE SHOWCASE DIAL: HIGH (now) · NORMAL · LOW — the legendaries a night + the medium moments an hour, both shaped by prime time',
    knobs: { level: 'high', legendPad: 0.05,
      levels: {
        high: { legend: { weeknight: [2, 3], partyMax: 4, partyFrom: 20, gap: 0.5, primeFrom: 18.5, primeTo: 23.25, tr3bWeeknight: true, bbLunch: 0.5 }, medium: { perHour: 15 } },
        normal: { legend: { weeknight: [1, 2], partyMax: 2, partyFrom: 21, gap: 0.75, primeFrom: 19.5, primeTo: 23.25, tr3bWeeknight: false, bbLunch: 0.25 }, medium: { perHour: 8 } },
        low: { legend: { weeknight: [0, 1], partyMax: 1, partyFrom: 22, gap: 1, primeFrom: 20.5, primeTo: 23.75, tr3bWeeknight: false, bbLunch: 0 }, medium: { perHour: 4 } },
      } } },
  // (PRIME TIME on the visitor's LOCAL time: the evenings most — Fri + Sat × weekend — a little at lunch, late night sparse, the dead hours
  // calm, the rest of the day off-peak)
  { id: 'showcase.prime', trigger: 'clock', status: 'live', src: 'core/harbor-showcase.js#primeWeight', what: 'PRIME TIME: 6–11 pm (Fri + Sat most), lunch 12–1 a little, late night sparse, ~2–6 am + mid-afternoon calm',
    knobs: { prime: [18, 23], weekend: 1.3, lunch: [12, 13], lunchW: 0.5, late: [23, 2], lateW: 0.3, dead: [[2, 6], [14, 17]], offW: 0.33, darkLead: 0.75, dawn: 6.5 } },
  // (THE MEDIUM TIER — a kind = a row with knobs.medium: { kind, weight, when: any | dark | day, cool (s between two of it) } — the city wires
  //  each: a plane pass + a helicopter pass at night; the dog walk is off — the crowd's cap)
  { id: 'medium.plane', trigger: 'clock', status: 'live', src: 'screens/harbor/air.js (a scheduled pass)', what: 'A MEDIUM MOMENT: an airliner crossing (on approach at night: its landing lights)', knobs: { medium: { kind: 'plane', weight: 1, when: 'any', cool: 150 } } },   // (SHELL 2.0 B2 — the owner: weight 2 → 1, the medium moments MIX)
  { id: 'medium.dogwalk', trigger: 'clock', status: 'off', off: 'SCHED: OFF — an extra walker on top of a full crowd broke the people cap (FOLK.cap: 13 at 390); the crowd keeps its own dog walkers (people.mix)', src: 'core/harbor-people.js', what: 'A MEDIUM MOMENT: a dog walker along the front, a stop mid-screen (every other one sniffs the hydrant)', knobs: { medium: { kind: 'dogwalk', weight: 1.5, when: 'any', cool: 420 } } },
  // (FRIENDS C — THE BLACK HELICOPTER, the owner Nov 6 "spooky black government helicopter": the medium tier's night helicopter pass IS it
  //  now — the same seeded times (kind 'heli': THE GOLDEN TABLE unchanged), a different craft + flight: baked ALL BLACK (scripts/bake/blackhelo.mjs),
  //  in LOW from one side, a `hover` s hover over the water sweeping its searchlight, then it banks away (climbs `climb` pt, shrinks to `away`);
  //  `size` × the patrol's near size; a jack on the desk + &force=blackhelo; NIGHT ONLY)
  { id: 'medium.heli', trigger: 'clock', status: 'live', src: 'core/harbor-heli.js (a scheduled pass) + screens/harbor/air.js#blackPlan', what: 'A MEDIUM MOMENT: THE BLACK HELICOPTER — in low over the harbor at night, a hover sweeping its searchlight over the water, then it banks away (nav lights, a white strobe, a red beacon)',
    jack: { id: 'blackhelo', label: 'BLACK HELI', order: 15, card: 'fire', dark: true, len: 30, lane: 'legend', start: 'blackhelo', note: 'the black helicopter: in low, a hover sweeping its searchlight, then away' },
    knobs: { medium: { kind: 'heli', weight: 1, when: 'dark', cool: 1200 }, black: { size: 1.55, y: 0.3, hover: 4.2, climb: 46, away: 0.62, speed: 44, sweep: 1.15 } } },
  // ---- SCHED Group 4 — THE BILLBOARD's MESSAGE QUEUE (core/harbor-billboard.js; the owner, Nov 2: "short, whole board"): each row a message —
  // kind (fireworks · party · lookup · postcard; CITY CONTROLS adds 'text'), its two short lines (≤ ~10 letters each: the board is ~70 pt wide
  // on an iPhone), its window (from: an evening hour; the end = its event), prio (the highest ON wins), every / show (s: it takes the WHOLE
  // board `show` s every `every` s inside its window, then the day's game is back)
  { id: 'billboard.fireworks', trigger: 'clock', status: 'live', src: 'core/harbor-billboard.js#hintsAt', what: 'THE BILLBOARD: FIREWORKS / TONIGHT 9:30 — a weeknight, from the evening until the show', knobs: { kind: 'fireworks', lines: ['FIREWORKS', 'TONIGHT'], from: 18, prio: 2, every: 180, show: 20 } },
  { id: 'billboard.party', trigger: 'clock', status: 'live', src: 'core/harbor-billboard.js#hintsAt', what: 'THE BILLBOARD on party days: STREET PARTY / FROM 8 (Friday) · FULL SHOW / AT 10 (Saturday) — from noon until it starts', knobs: { kind: 'party', fri: ['STREET PARTY', 'FROM'], sat: ['FULL SHOW', 'AT'], from: 12, prio: 1, every: 180, show: 20 } },
  { id: 'billboard.lookup', trigger: 'event', status: 'live', src: 'core/harbor-billboard.js#hintsAt', what: 'THE BILLBOARD: LOOK UP / ANY MINUTE — `lead` min before each of tonight’s legendaries (NEVER naming it)', knobs: { kind: 'lookup', lines: ['LOOK UP', 'ANY MINUTE'], lead: 5, prio: 3, every: 60, show: 25 } },
  // CITY FIXES + HOLD'EM (the owner, Nov 8 — DECIDED): the roof board's BASE POSTER — TEXAS HOLD'EM · COMING SOON (design B · THE CHIP) in place
  // of the day's game until the owner changes it (no end date; /admin → THE BILLBOARD: off · COMING SOON · NOW OPEN). The messages above still
  // interrupt it; THE BILLPOSTER pastes it once (the first evening) then skips his daily change. These knobs are the DEFAULT (no switch set)
  { id: 'billboard.holdem', trigger: 'calendar', status: 'live', src: 'core/harbor-holdem.js#holdemShow', what: 'THE HOLD’EM BILLBOARD: the speakeasy roof board’s base poster (COMING SOON → NOW OPEN) from `since` until the owner switches it off; the billposter pastes it once', knobs: { kind: 'base', poster: 'holdem', on: true, bar: 'soon', since: '2026-11-08' } },
  { id: 'billboard.postcard', trigger: 'calendar', status: 'live', src: 'core/harbor-billboard.js#hintsAt', what: 'THE SUNDAY POSTCARD: LAST WEEK / THE BLACKBIRD (a small silhouette of one legendary that came last week) — Sunday daytime', knobs: { kind: 'postcard', lines: ['LAST WEEK'], dow: 0, from: 10, to: 18, prefer: 'blackbird', prio: 0, every: 240, show: 25 } },
  { id: 'party.crowd', trigger: 'clock', status: 'live', src: 'core/harbor-streetparty.js#crowdK', what: 'THE STREET PARTY crowd: grows through the warm-up, fullest at the peak, thins after 1 am, gone by 2',
    knobs: { warm: 20.5, full: 21.75, thin: 25.0, gone: 26.0, scan: [19.5, 26.5] } },   // (scan: the span its pockets' windows are read over)
  // (NIGHT-C — THE SAME PARTY SONG ON EVERY PHONE, the owner Oct 30: the City 2.0 PARTY deck itself on the server clock — core/party-deck.js,
  // audio/party-music.js; fastBpm: a song at or above it is a FAST one for the dance kinds; len + fast: the stand-in when the songs aren't loaded)
  { id: 'party.songs', trigger: 'beat', status: 'live', src: 'core/party-deck.js + core/harbor-streetparty.js#partyTimeline', what: 'THE PARTY SONGS ON THE SERVER CLOCK: the PARTY deck seeded by the evening, back to back from 8 pm — every phone hears the same song at the same moment (a phone joining mid-song lands in place); the panel\'s PARTY plays the epoch\'s deck, &force=dance a deck from the force moment',
    knobs: { from: 20, to: 26.6, fastBpm: 110, len: [185, 250], fast: 0.55 } },
  { id: 'party.break', jack: { id: 'dance', label: 'DANCE', order: 10, card: 'dance', dark: true, len: 300, lane: 'free', start: 'hold:dance', note: 'a dance break on the next song' }, trigger: 'beat', status: 'live', src: 'core/harbor-streetparty.js#danceBreaks', what: 'A DANCE BREAK ~every 20 min: ONE SONG where almost everyone dances, starting ON the start of the party song every phone hears (seeded)',
    knobs: { from: 21.0, to: 25.4, every_min: 20, jitter_min: 3, minGap_min: 12 }, conflicts: ['traffic.front', 'cabstand'] },
  { id: 'party.break.force', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#forcedBreaks', what: '&force=dance — a deck from the force moment: a break on its first song (`first` s in), then on the first song starting each 5 min (any night; &dance=conga|bounce|wands|swing|mix picks the kind)',
    knobs: { every: 300, first: 6, song: 210 } },
  { id: 'party.spill', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#spillPlan', what: 'INTO THE STREET: in a break the party steps down into the street\'s upper band; the front street\'s traffic holds',
    knobs: { lead: 14, trail: 16 }, conflicts: ['traffic.front'] },
  { id: 'party.bench', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js', what: 'DANCERS ON THE BENCH: in a break up to three climb onto the cab stand\'s bench', conflicts: ['cabstand'] },
  { id: 'party.conga', trigger: 'event', status: 'live', src: 'core/harbor-streetparty.js#congaPlan', what: 'THE BIG CONGA: in a conga break a long line in from the right edge, across the whole promenade + off the left' },
  { id: 'cart.party', trigger: 'clock', status: 'live', src: 'core/harbor-routines.js#cartEvening', what: 'the chestnut cart PACKS UP before the party\'s crowd on a party night (any other night: VENDOR.to)',
    knobs: { partyTo: 20.4 } },
  // ---- PART 10 — THE FIREWORKS (core/harbor-fireworks.js + screens/harbor/fireworks.js; the owner, Oct 31 5:02 pm): EVERY night. at: the
  // local hour (or once properly dark — the sun at darkEl° — if later: a summer twilight); latest: no show starts after it; gap: the
  // minutes kept clear round a legendary / a raid / the ghost ship (s — the show WAITS for them); dur: the show's length range (s);
  // finale: the party show's finale (s, before the curtain + the salutes); n: the midnight shells; cancel: the weather that calls it off
  // (rain / fog / snow 0..1, wind m/s — a gale); the sign dims `dim` for the shows (not midnight's — they stay below it)
  { id: 'fireworks.show', jack: { id: 'fireworks', label: 'FIREWORKS', order: 3, card: 'fireworks', dark: true, len: 95, lenFull: 300, lane: 'show', start: 'fireworks', crew: true, limit: 'fireworks', note: 'the weeknight show (~90 s) or the full party show (~5 min)' }, trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#weeknightScript', what: 'THE WEEKNIGHT SHOW: a short show (~60–90 s, a few dozen shells) at 9:30 pm on every night that is not a party night — the sign dims, the people look up',
    knobs: { at: 21.5, latest: 23.4, gap: 120, darkEl: -7.5, dur: [62, 88], dim: 0.06, cancel: { rain: 0.12, wind: 16, fog: 0.55, snow: 0.5 } },
    conflicts: ['legendaries', 'raid', 'storm', 'helicopter.patrol'] },
  { id: 'fireworks.party', trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#partyScript', what: 'THE PARTY SHOW: the full show (~4–5 min) at 10 pm on a party night, building to a FINALE (a full sky) + THE GOLD WILLOW CURTAIN over the skyline; synced to the party song; the dancers stop + look up',
    // (CITY CONTROLS A — THE FINALE's GAP, the owner Nov 2 11:56 am: "the length of the pause feels unnatural" → ONE CONTINUOUS CLOSE: the
    // gold willows LAUNCH `curtainAfter` [s after the eggs' burst — the soonest, the latest for a STRONG beat] while the crackle still dies,
    // on the next strong beat (half a bar; the next beat if that's later than the latest) — never a bar later; `curtainRise` [barge, sky] s;
    // CC-B: THE SWEEP — left → right, each willow `curtainStep` s after the one to its left. THE OWNER's CC-B REVIEW (Nov 2, 6:14 pm — "too
    // slow"; half a beat a willow took ~2–2.4 s): A FAST ROLLING CURTAIN like PART 10's first finale ("that was perfect": 9 willows in
    // ~0.9 s, x every 0.105) — 0.115 s apart, the whole city in ~0.9 s, the curtain hanging together; on the song only the FIRST willow
    // takes the strong beat (the gap after the eggs unchanged), the rest keep this stagger (PART 10's own rule)
    knobs: { at: 22.0, latest: 23.6, gap: 150, dur: [250, 290], finale: 40, curtainAfter: [0.5, 1.25], curtainRise: [1.85, 1.75], curtainStep: 0.115 },
    conflicts: ['legendaries', 'raid', 'storm', 'party.break', 'helicopter.patrol'] },
  { id: 'fireworks.midnight', trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#midnightScript', what: 'MIDNIGHT: 2–4 shells, low (below the sign, no dim) — "someone setting off a few"; every night',
    knobs: { at: 24.0, latest: 24.6, gap: 60, n: [2, 4] }, conflicts: ['legendaries', 'storm'] },
  // ---- FIXED POINTS
  { id: 'rosie.bell', trigger: 'clock', status: 'live', fixed: true, src: 'core/harbor-boats.js', what: 'ROSIE\'s ship\'s bell as she docks at :00 (the horn ~:03 as she casts off) — the owner: NEVER moved',
    knobs: { minute: 0, service: { first: 7, last: 23, stretch: 1.6, dwell: 180, out: 200, dinner: 19 } } },
  { id: 'boats.fishing', trigger: 'clock', status: 'live', src: 'core/harbor-boats.js#FISH', what: 'THE FISHING TUG: out at dawn (`out`, its bow lantern lit while it’s dark), back in the late afternoon (`back`)', knobs: { out: 6.15, back: 16.5 } },
  { id: 'snow.work', trigger: 'calendar', status: 'live', src: 'core/harbor-snowwork.js#SNOWWORK + FLUSH', what: 'THE SNOW CREWS after a snowfall (the plows + the salter: a pass every `every` s, the salt `saltAfter` s behind, the MORNING round `morning`) + THE WATER WAGON in the small hours (`flush`: from `h0` ± `jitter` h, a shift `len` s, a pass every `every` s, the road dry `dry` s after)',
    knobs: { every: 2400, saltAfter: 600, morning: [[6.65, 'plow', 'near'], [6.9, 'plow', 'far'], [7.2, 'salter', 'near'], [7.45, 'salter', 'far']], flush: { h0: 2.75, jitter: 0.08, len: [40 * 60, 46 * 60], every: 380, dry: 25 * 60 } } },
  { id: 'snowman', trigger: 'calendar', status: 'live', src: 'core/harbor-snowman.js#snowmanPlan', what: 'THE SNOWMAN: built on the snow days of January (`from` → `to`, the last week from `lastWeek`)',
    knobs: { from: 2, to: 31, lastWeek: 24 } },
  { id: 'windows.edgeshades', trigger: 'clock', status: 'live', src: 'core/harbor-scenes.js#edgeShadePlan', what: 'THE EDGE WINDOWS’ SHADES: from `from` someone raises / lowers one now + then (every `every` [min, + up to] s), all the way down after hours between `downFrom` → `downTo`',
    knobs: { from: 18, downFrom: 24, downTo: 25.25, every: [1500, 3000] } },
  // ---- THE REST OF THE CITY (SCHED moved their times in: each row's knobs, read by its `src`)
  { id: 'lamps', trigger: 'darkness', status: 'live', src: 'core/harbor-lamps.js', what: 'the implied lamps + the beacons: the photocell at dusk, off at dawn',
    knobs: { from: 0.08, to: 0.55, warm: 1.3, slot: 420, chance: 0.5, out: 0.22, outS: [3, 6] } },
  { id: 'windows.dusk', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js', what: 'the speakeasy\'s windows light at dusk; late at night they go out one by one' },
  { id: 'windows.moments', trigger: 'clock', status: 'live', src: 'core/harbor-moments.js#hourPlan + MOMENTS', what: 'THE WINDOWS’ MOMENTS (the routines + the random draws — most RETIRED since WINDOWS, windows.old): each moment’s timing (`moments`: at / jitter for a routine, hours [from, to], len s, cooldown s, party × weight, plays + nights for a legendary one, from / to for a holiday’s chunks, eve × on the holiday’s night, minStage of its build-up); the draw: `rarity` (a chance a slot), every `gap` [base, span] s (`party` after dark on a party night), at most `maxAtOnce` together',
    knobs: { rarity: { common: 1, uncommon: 0.34, rare: 0.008 }, maxAtOnce: 2, gap: { normal: [10, 10], party: [7, 7] },
      moments: {
        wake: { at: 7, jitter: 8, len: 42 },
        'shop-open': { at: 9, jitter: 3, len: 44 },
        bartender: { at: 16, jitter: 6, len: 52 },
        'lights-out': { at: 21.5, jitter: 12, len: 16 },   // (WSP — the owner, Nov 1: the TV ON ~9:30 pm, was ~10)
        dance: { hours: [19.5, 2], len: 9, cooldown: 30, party: 2 },
        toast: { hours: [19, 2.5], len: 7, cooldown: 24, party: 1.6 },
        sax: { hours: [20, 2], len: 15, cooldown: 200, party: 1.5 },
        cat: { hours: null, len: 26, cooldown: 240 },
        fan: { hours: [11.5, 21], len: 55, cooldown: 300 },
        peek: { hours: [7.5, 2], len: 6.5, cooldown: 1800 },
        tango: { hours: [20.5, 23.75], len: 30, plays: 3, nights: 4 },
        ghost: { minStage: 0.45, hours: [18, 3], len: 11, cooldown: 70, eve: 2.4 },
        mummy: { minStage: 0.6, hours: [19, 2.5], len: 10, cooldown: 110, eve: 2 },
        witchsil: { minStage: 0.7, hours: [19, 2.5], len: 14, cooldown: 160, eve: 1.6 },
        costume: { minStage: 0.85, hours: [19.5, 2.5], len: 9, cooldown: 45, eve: 3, party: 2 },
        ofrenda: { minStage: 0.5, hours: [16.5, 23.5], len: 14, cooldown: 120, eve: 1.5 },
        mirror: { hours: [20.75, 2.5], len: 8.5, cooldown: 150, party: 3 },
        eyes: { hours: [23, 4], len: 150, plays: 3 },
        cash: { hours: [22.5, 2.5], len: 26, cooldown: 420, party: 0.6 },
        table: { from: 15, to: 21.5, hours: [15, 21.5], len: 900, cooldown: 900 },
        football: { from: 12.5, to: 19, hours: [12.5, 19], len: 900, cooldown: 900 },
      }, eyesPerMonth: 2 } },
  { id: 'windows.night', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js#edgeMoods + quietNight + bedtimes + lateTvK', what: 'THE BUILDING AT NIGHT: the edge windows’ mood lights out at `edgeOff` [h, + up to s]; THE QUIET NIGHTS (`quiet`: p a Sun–Wed night, `thu` a Thursday — never Fri / Sat) with their BEDTIMES (`bed`: the first lamp-off `first` [min after midnight, + up to min], then one every `gap` [min, + up to min]); the skyline’s LATE TVs (`lateTv`: on from → full, fading → off, evening hours)',
    knobs: { edgeOff: [23.8, 1800], quiet: { p: 0.25, thu: 0.12 }, bed: { first: [20, 10], gap: [7, 8] }, lateTv: [22, 22.33, 26.67, 27] } },
  { id: 'windows.boss', trigger: 'clock', status: 'live', src: 'core/harbor-moments.js#bossDayPlan + bossSignal', what: 'THE BOSS’s ROOM BY DAY (the shade drawn): `perDay` [min, max] rare events between `from` (+ up to `jitter` s) and `to`, every `gapMin` [min, + up to min]; THE TELL (the violet lamp + the spade) from `signalFrom` (Saturday · a weeknight run) until the truck (`signalTo` without one)',
    knobs: { perDay: [5, 8], from: 7.5, jitter: 1800, to: 21.3, gapMin: [50, 110], signalFrom: { sat: 15, week: 17 }, signalTo: { sat: 18.65, week: 22.95 } } },
  // (NIGHT-C — THE QUIET BUILDING, the owner Oct 29 5:52 pm: from the rooms' dusk to the dawn, not on a party night; litMin / litMax: how
  // many of the three parked rooms are lit behind their blinds tonight; outFrom / outTo: the lit ones' lamps going out, one by one)
  { id: 'windows.parked', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js#parkedNight + screens/harbor/windows.js', what: 'THE QUIET BUILDING: at night only the boss’s TV room + the two cut-off side rooms stay live; the bar, the jazz room + the upper middle (the boxer’s — SKY) PARKED behind drawn blinds, a mix of warm-lit + dark, going out one by one; party nights unchanged',
    knobs: { litMin: 1, litMax: 2, outFrom: 22.25, outTo: 25.5 }, conflicts: ['window.party'] },
  { id: 'signs.modes', trigger: 'clock', status: 'live', src: 'core/harbor-roofmodes.js', what: 'the roof signs\' hourly modes (spell / race / breath)',
    knobs: { minute: 60, slot: 15, spellEvery: 180, spellJitter: 60, nightStages: [22, 1] } },
  { id: 'party.pulse', trigger: 'beat', status: 'live', src: 'core/harbor-beat.js', what: 'the party pulse: the lights on the song\'s grid (a trusted grid always punches)' },
  { id: 'holidays', trigger: 'calendar', status: 'live', src: 'core/harbor-holiday.js', what: 'the holidays, their build-ups day by day + the sign dressings',
    knobs: {
      // the calendar (the year of the moment asked): build = when the build-up starts, day = the day itself [from, to) in local days, night =
      // the holiday's own night [from, to) (hours on the day's clock: 26 = 2 am the next morning), down = the come-down [from, to)
      table: [
        { id: 'halloween', label: 'HALLOWEEN', build: [10, 1], day: [10, 31], night: [17.5, 28], end: [11, 1, 4], downLen: 0 },
        // (Day of the Dead: Nov 1 + 2 — dressed 4 → 7 am on Nov 1 while Halloween's last pieces go; Nov 3 down through the day)
        { id: 'dotd', label: 'DAY OF THE DEAD', start: [11, 1, 4], dressLen: 3, day: [11, 1], days: 2, night: [17, 23.5], down: [11, 3, 7], downLen: 12 },
        // 11a-2 — THANKSGIVING (the fourth Thursday of November): the build-up from Nov 4 (Day of the Dead's last pieces gone the evening
        // before) growing day by day to the Wednesday before; that Wednesday's evening = THE HOMECOMING party night (`eve`); the day itself
        // (the parade in the morning, the quiet warm afternoon + evening); everything down OVERNIGHT into Black Friday (4 am)
        { id: 'thanksgiving', label: 'THANKSGIVING', build: [11, 4], eveH: 17.5, end: 4 },
      ],
      // HALLOWEEN's build-up: the big jack-o'-lanterns' day (Oct), the second spider's, the giant pumpkin's (arrive / carve / carveH), the
      // trick-or-treaters until `trickOrTreatTo`, the zombies `zombies` [from, to] (evening hours), the small hours until `lateTo`
      halloween: { bigDay: 20, spider2Day: 29, giant: { arrive: 20, carve: 28, carveH: 4 }, trickOrTreatTo: 21.25, zombies: [20, 2], lateTo: 6,
        witch: { from: 18, to: 28.5, everyMin: [7, 25] }, jinks: { afterDusk: 0.4, to: 26, every: [180, 600] } },   // (witch: a pass every everyMin [the night, the last week]; jinks: the bats round the roofs, every s)
      // THANKSGIVING's day: the leaf raker (before day `days` of the build-up, `from` → `to`), the parade, the chimneys, the pies, the tables
      thanksgiving: { raker: { days: 18.5, from: 8.6, to: 16.2 }, parade: [8.5, 11.6], chimneys: 11, pies: [12, 18.5], tables: 14.5 },
      // DAY OF THE DEAD: the procession `after` h past sunset for `len_min`; the monarchs from `monarchs[0]` h until `monarchs[1]` h before dusk
      dotd: { procession: { after: 1 / 6, len_min: 70 }, monarchs: [9.5, 0.5], monarch: { slot: 600, len: 22, chance: 0.75 } },   // (monarch: a ten-minute slot carries one at `chance`, ~`len` s across)
    } },
  { id: 'workers', trigger: 'clock', status: 'live', src: 'core/harbor-workers.js', what: 'the workers\' day (milk 6:00, newsboy 7:00, barber 8:30, the beat cop 9 am + 9 pm…)',
    knobs: { shows: {
      // ~5:30 the street sweeper — a 1920s "white wing" with his broom + can cart; a wet streak left drying on the cobbles
      sweeper: { days: [1, 2, 3, 4, 5, 6], win: [5.35, 5.6], len: 20 * 60, prio: 2 },
      // 6:00 THE MILK TRUCK (fixed): the milkman's wire carrier of bottles left on the barbershop's step (they wait there until the barber)
      milk: { days: [1, 2, 3, 4, 5, 6], at: 5.982, len: 4.6 * 60, prio: 5 },
      // the newspaper van drops two twine-tied bundles at the vendor spot before the newsboy comes (the bundles wait: a trace)
      newsdrop: { days: [0, 1, 2, 3, 4, 5, 6], at: null, before: 'newsboy', lead: 24 * 60, len: 70, prio: 4 },
      // weekday mornings: THE TRASH TRUCK — the collector carries the can from beside the front-left lamppost to the truck, tips it, brings it back
      trash: { days: [1, 2, 3, 4, 5], win: [6.3, 7.3], len: 3.6 * 60, prio: 3 },
      // mid-morning THE ICE MAN: a block on his shoulder with the tongs, to the side door
      ice: { days: [1, 2, 3, 4, 5], win: [9.75, 10.6], len: 4.4 * 60, prio: 2 },
      // Tue + Fri, late morning → noon: THE WINDOW WASHERS on their hanging platform, the upper floor then the one below
      washers: { days: [2, 5], win: [10.55, 10.85], len: 84 * 60, prio: 3 },
      // Wednesday: THE ROOFTOP GARDENER (the beds through the seasons)
      gardener: { days: [3], win: [9.3, 9.6], len: 95 * 60, prio: 2 },
      // ~2 pm the "SODA WATER" truck: crates to the side door (wink)
      soda: { days: [1, 2, 3, 4, 5], win: [13.7, 14.35], len: 5.5 * 60, prio: 2 },
      // MONDAY 1–4 pm THE SIGN PAINTERS repaint the blade for the new week, in stages (paint-out → chalk → letters → the gilt)
      painters: { days: [1], at: 13.0, len: 170 * 60, prio: 5 },
      // ~5–6 pm THE BILLPOSTER changes the roof billboard (the daily game change): on the catwalk, pasting the new poster in strips
      billposter: { days: [0, 1, 2, 3, 4, 5, 6], win: [16.85, 17.3], len: 34 * 60, prio: 4 },
      // ~11 pm (a few nights a month) THE BOOTLEGGERS: a quiet truck (no lamps), crates passed down the basement hatch, a lookout
      bootleg: { days: [0, 1, 2, 3, 4], win: [22.7, 23.25], len: 7 * 60, prio: 3, rare: 0.09 },
      // SATURDAY: the bootleggers' BIG delivery before the party night (every Saturday, ~6:30–7 pm)
      delivery: { days: [6], win: [18.45, 18.9], len: 11 * 60, prio: 4 },
      // CAUSE AND EFFECT (the city notices itself): the morning after a blade bulb went out — the repairman's tall ladder at the corner
      bulb: { days: [0, 1, 2, 3, 4, 5, 6], win: [9.15, 9.7], len: 8 * 60, prio: 4, after: 'bulbOut' },
      // the morning after a lamppost's bad night — a short ladder at that lamp
      // (PROM — RETIRED: `lamp`, the lampman's stepladder at a lamppost — the promenade has no lampposts now (the implied lamps stand behind
      // the viewer); a lamp's bad night still stutters its implied pool until the next day — lampFault below + scene.js#lampLife)
      // the morning after a party night: the extra sweep (7:30) + a cleanup crew on the roof (9 am)
      sweep2: { days: [0, 6], win: [7.4, 7.7], len: 32 * 60, prio: 3, after: 'party' },
      crew: { days: [0, 6], win: [8.95, 9.2], len: 70 * 60, prio: 3, after: 'party' },
      // POLISH 5 — HOT SUMMER AFTERNOONS (the real temperature ≥ HOT_C — ctx.hot(key), the live weather): a city worker opens THE HYDRANT,
      // its spray arcs onto the cobbles for a couple of minutes (a kid runs through it), shut again; the wet patch dries (~2 hot days in 3)
      hydrant: { days: [0, 1, 2, 3, 4, 5, 6], win: [13.6, 16.7], len: 3.6 * 60, prio: 2, hot: true, chance: 0.66 },
      // 11a-2 — THE LEAF RAKER (the Thanksgiving build-up: Nov 4 → 22, late morning): a groundskeeper rakes the fallen leaves under the
      // trees into two piles, bags them + carries the sack off (dates: a local-date gate — PURE)
      // 11a-2 — BLACK FRIDAY: THE FIRST CHRISTMAS CREW (core/harbor-xmas.js — its hour + length; the strings appear as they work)
      xlights: { days: [0, 1, 2, 3, 4, 5, 6], prio: 7 },
      // 9e — THE WATER WAGON's NIGHT (plan.md "FILLING THE DEAD TIMES — DECIDED" (2)): while the street flusher makes its slow passes on the back
      // road (~2:45 → 3:30 — core/harbor-snowwork.js#flushWindow), a crewman opens THE HYDRANT and hoses the cobbles (the hot day's spray,
      // its wet patch drying); never after rain, below freezing or on snow (ctx.flush(key) — the scene's live conditions)
      hoser: { days: [0, 1, 2, 3, 4, 5, 6], win: [2.95, 3.1], len: 4 * 60, prio: 3, flush: true },
      raker: { days: [1, 2, 3, 4, 5, 6], win: [10.9, 11.5], len: 32 * 60, prio: 2, dateWin: [11, 4, 22] },   // (dateWin: [month, from day, to day])
    }, slack: 60 * 60 } },
  { id: 'workers.regulars', trigger: 'clock', status: 'live', src: 'core/harbor-workers.js#REGULARS', what: 'THE REGULARS (they may overlap a show): the newsboy, the evening edition, the barber, the beat cop + his night patrol, the mailman, the bartender, the doorman, the flower seller, the musician, the staff locking up, the henchman’s night shift — evening ones on the evening’s clock (25 = 1 am)',
    knobs: {
      // 7:00 THE NEWSBOY (fixed) at his stand till ~10 (the weekend edition 8 → 11); the EVENING EDITION 4:30 → 6:30 on weekdays
      newsboy: { days: [1, 2, 3, 4, 5], at: 7.0, len: 3 * 3600, weekend: { at: 8.0, len: 3 * 3600 } },
      evening: { days: [1, 2, 3, 4, 5], at: 16.5, len: 2 * 3600 },
      // 8:30 THE BARBER (fixed, Mon–Sat): takes in the milk, sweeps the step, cranks the awning
      barber: { days: [1, 2, 3, 4, 5, 6], at: 8.5, len: 13.5 * 60 },
      // 9:00 am + 9:00 pm THE BEAT COP (fixed, every day): a friendly stroll through — the baton's twirl, a tip of the hat
      cop: { days: [0, 1, 2, 3, 4, 5, 6], at: 9.0, len: 110 },
      patrol: { days: [0, 1, 2, 3, 4, 5, 6], at: 21.0, len: 110 },
      // ~10:30 THE MAILMAN to the barbershop
      mail: { days: [1, 2, 3, 4, 5, 6], win: [10.25, 10.75], len: 95 },
      // ~4 pm THE BARTENDER arrives at the side door (the window moment's lights come on behind him)
      bartender: { days: [0, 1, 2, 3, 4, 5, 6], at: 15.93, len: 60 },
      // from dusk THE DOORMAN at the side door (guests whisper the password); on party nights he hands over to the line's doorman
      doorman: { days: [0, 1, 2, 3, 4, 5, 6], dusk: 0.17, until: 25.85 },
      // dusk THE FLOWER SELLER (Wed–Sat, most weeks) selling to couples heading in
      flowers: { days: [3, 4, 5, 6], dusk: 0.3, len: 2.4 * 3600, chance: 0.72 },
      // ~8 pm THE MUSICIAN with his double-bass case (the band) — not on Mondays (the band's night off)
      musician: { days: [0, 2, 3, 4, 5, 6], win: [19.85, 20.1], len: 75 },
      // ~2 am THE BAR STAFF lock up + leave (the evening's own clock: 26 = 2 am)
      staff: { days: [0, 1, 2, 3, 4, 5, 6], at: 25.97, len: 150 },
      // 9e — THE NIGHT SHIFT (plan.md "FILLING THE DEAD TIMES — DECIDED" (1)): the boss's HENCHMAN patrols the block with a flashlight in the
      // small hours (2:03 → 5:55, every night — after the staff have locked up) + the weekday late nights (Sun–Thu, 11:24 pm → 12:51 am);
      // his BEAT (the left end of the front, a look round, the corner, a look up the street, a check of the door) + his LAP (off round the
      // block, back a minute later)
      henchman: { days: [0, 1, 2, 3, 4, 5, 6], at: 2.05, len: 3.85 * 3600 },
      henchman2: { days: [0, 1, 2, 3, 4], at: 23.4, len: 1.45 * 3600 },
    } },
  { id: 'workers.faults', trigger: 'calendar', status: 'live', src: 'core/harbor-workers.js#bulbOut + lampFault + boardLampOut', what: 'CAUSE AND EFFECT (the nights the city breaks a little — the repairmen the morning after): a BLADE BULB dies one night a week (`bulb`: from + span, local h); a lamp’s bad night (`lamp`: p a night, from + span); a billboard lamp burns out (`board`: p, from + span)',
    knobs: { bulb: { from: 21.5, span: 3 }, lamp: { p: 0.28, from: 18, span: 3 }, board: { p: 0.11, from: 19.5, span: 5.5 } } },
  // (SCHED — THE MIGRATION, Nov 2: the older systems’ timing knobs moved in; the planner READS them, its behaviour stays in its file)
  { id: 'cabs', trigger: 'clock', status: 'live', src: 'core/harbor-cabs.js#cabEvents', what: 'THE CABS on the back road: from the evening to the small hours a cab call a people-block at `p` (party nights `party` calls), drop-offs before `swap`, pick-ups after',
    knobs: {
      from: 19.25,
      to: 25.6,
      p: 0.5,
      party: [1, 2],
      swap: 23,
    } },
  { id: 'cabstand', trigger: 'clock', status: 'live', src: 'core/harbor-cabs.js#standEvents', what: 'THE CAB STAND: a waiter walks up to the bench + sits (`sit` s of patience) — `p` a block (`party` on a party night), some give up + hail on the back road (`hail`); &force=cabstand: one every `every` s',
    knobs: { from: 7.5, to: 25.4, p: 0.42, party: 0.72, sit: [55, 150], hail: 0.38, every: 100 } },
  { id: 'traffic', trigger: 'clock', status: 'live', src: 'core/harbor-traffic.js#laneSpawns', what: 'THE TRAFFIC on the back road: cars a `block` by the hour’s band (day · evening · late · party), the party’s cars glowing from `glowFrom`',
    knobs: {
      block: 120,
      perBlock: { day: [2, 4], evening: [1, 3], late: [0, 1], party: [2, 3] },
      bands: { party: 20, day: [7, 19], evening: [19, 24], lateFrom: 1.5, lateTo: 6 },
      glowFrom: 21,
    } },
  { id: 'dance.circle', trigger: 'clock', status: 'live', src: 'core/harbor-routines.js#danceSlot', what: 'THE DANCE CIRCLE on PARTY NIGHTS: every hour on the hour (`slot`) from `from` → `to`, two songs; &force=dance: every `force.slot` s',
    knobs: {
      // SP5 — ON THE HOUR (the owner, DECIDED — replaces the always-on circle from 10 pm): on PARTY NIGHTS (any party mode) EVERY HOUR ON THE
      // HOUR the dancers walk up to the centre circle (from the side door, arriving over ~30 s: the stagger + the walk), dance for TWO SONGS
      // (~2 × 3.5 min on the party's clock — the same for everyone; when music plays, the dance clock shapes the moves to the songs:
      // core/harbor-dance.js — a wind-down at a song's end, a cheer, idle in the gap, the pick-up), then leave in twos + threes. Never under a
      // holiday centrepiece, never during a raid or a legendary (ctx.event / ctx.blocked); joins mid-way (seeded on the clock).
      slot: 3600,
      from: 20.5,
      to: 26.25,
      chance: 1,
      start: 0,
      len: 420,
      songs: 2,
      song: 210,
      // (&force=dance: a circle every 5 minutes, any night)
      force: { slot: 300, start: 8, len: 240 },
    } },
  { id: 'cart', trigger: 'clock', status: 'live', src: 'core/harbor-routines.js#cartEvening', what: 'THE CHESTNUT CART: the cold months’ evenings (`months`), wheeled in at `from` (± `jitter` h), packed up at `to` (a party night: cart.party)',
    knobs: {
      months: [10, 11, 12, 1, 2, 3],
      from: 18.5,
      to: 21.5,
      jitter: 0.18,   // (the cart's evening, local hours; ± up to ~11 min a day)
    } },
  { id: 'parade', trigger: 'calendar', status: 'live', src: 'core/harbor-parade.js#paradeWindow', what: 'THE THANKSGIVING PARADE: the fourth Thursday at `from` (local), `len` s long',
    knobs: { from: 9.0, len: 2.4 * 3600 } },
  { id: 'tower', trigger: 'calendar', status: 'live', src: 'core/harbor-tower.js#towerAt', what: 'THE CONSTRUCTION TOWER’s year: the implosion the 3rd Sunday of April, announced `announceDays` before, rubble `rubbleDays`, rising from `rise` [month, day], topping `top`, finishing `finish`, the crane off `craneOff`, the GRAND OPENING at `openH`',
    knobs: { announceDays: 3, rubbleDays: 10, rise: [6, 1], top: [9, 1], finish: [9, 8], craneOff: [9, 15], openH: 19, implodeH: 10 } },
  { id: 'xmas.prelude', trigger: 'calendar', status: 'live', src: 'core/harbor-xmas.js#xmasPrelude', what: 'CHRISTMAS’s PRELUDE: Black Friday’s RUSH (`rush`: in → full → out, local h), the TREE STAND (from `tree.h` on Black Friday to `tree.to` [month, day, h]), the first crew (`crew.at` h, `crew.len` min), the strings lit `early` h before dusk, the banner `banner` [from, to] h',
    knobs: {
      rush: [6.5, 8.5, 18.5, 21],
      tree: { h: 7.5, to: [12, 24, 21] },
      early: 0.25,
      off: 25,
      until: [1, 6],
      // THE FIRST CREW (core/harbor-workers.js#SHOWS.xlights): its start (local h) + length (min) — the strings appear as they work
      crew: { at: 9.75, len: 150 },
      banner: [9, 17],
    } },
  // (the WILDLIFE — core/harbor-wildlife.js: each animal’s slot / season / chance / hours; the planners draw on the clock, every phone the same)
  { id: 'wild.pigeons', trigger: 'clock', status: 'live', src: 'core/harbor-wildlife.js#pigeonSlot', what: 'THE PIGEONS: a flock re-drawn every `slot` s — how many by the hour (`curve`: [until h, birds]), on the cobbles or the ledges, roosting at night',
    knobs: { slot: 540, curve: [[9.5, 6.5], [12, 5], [14, 4.5], [17, 5], [99, 4]] } },
  { id: 'wild.gulls', trigger: 'clock', status: 'live', src: 'core/harbor-wildlife.js#gullSlot', what: 'THE GULLS landing by day: a `slot` s draw, each staying `stay` s',
    knobs: { slot: 480, stay: [50, 220] } },
  { id: 'wild.owl', trigger: 'calendar', status: 'live', src: 'core/harbor-wildlife.js#owlDay', what: 'THE SNOWY OWL: the winter months (`months`), `chance` a day, moving every `move` s',
    knobs: { months: [12, 1, 2, 3], chance: 0.28, move: [1500, 3600] } },
  { id: 'wild.squirrel', trigger: 'clock', status: 'live', src: 'core/harbor-wildlife.js#squirrelSlot', what: 'THE SQUIRREL in the trees: a `slot` s draw, its `chance` by season',
    knobs: { slot: 420, chance: { spring: 0.5, summer: 0.55, autumn: 0.7, winter: 0.1 } } },
  { id: 'wild.coyote', trigger: 'calendar', status: 'live', src: 'core/harbor-wildlife.js#coyoteNight', what: 'THE COYOTE crossing at night: `chance` a night',
    knobs: { chance: 0.3 } },
  { id: 'wild.cat', trigger: 'calendar', status: 'live', src: 'core/harbor-wildlife.js#catEvening', what: 'THE CAT on the promenade: `chance` an evening (`winter` in the cold months), staying `len` s; THE BLACK CAT on Halloween (`black`: its lead + until)',
    knobs: { chance: 0.35, winter: 0.12, len: [360, 960], black: { lead: 0.15, until: 23.75, untilEve: 25.5 } } },
  { id: 'wild.fireflies', trigger: 'clock', status: 'live', src: 'core/harbor-wildlife.js#fireflyCount', what: 'THE FIREFLIES: early summer (`season`: month×100 + day) after dark, `from` → `to`',
    knobs: { from: 21.2, to: 24.6, season: [610, 831] } },
  { id: 'wild.heron', trigger: 'calendar', status: 'live', src: 'core/harbor-wildlife.js#heronMorning', what: 'THE HERON on the piling: the warm months (`months`), `chance` a morning, staying `stay` s',
    knobs: { months: [4, 5, 6, 7, 8, 9, 10], chance: 0.45, stay: [1500, 4200] } },
  { id: 'wild.fish', trigger: 'clock', status: 'live', src: 'core/harbor-wildlife.js#fishSlot', what: 'THE FISH jumping: a `slot` s draw',
    knobs: { slot: 45 } },
  // (THE PEOPLE — core/harbor-people.js: who’s out when — the day’s periods, the weekend’s later evening, the side door’s guests, the line,
  //  the joggers, the bus, the rooftop)
  { id: 'people.mix', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#mixNow', what: 'WHO’S OUT WHEN: the day in periods (`periods`: from → to, n [weekday, weekend] on screen, the kinds’ weights), a weekend from Friday `weekendFrom` with its evening `mood.lateShift` h later, the livelier weekday late nights (`lateWeek`), the slow Sunday morning (`sundaySlow`); party nights / rain / the street party’s crowd scale it (`mood`)',
    knobs: { periods: [
      { id: 'small-hours', from: 2, to: 5.5, n: [0.3, 0.5], mix: { nightworker: 2, lone: 1 } },
      { id: 'early', from: 5.5, to: 8, n: [2.3, 1.7], mix: { dogwalker: 3, worker: 2, water: 1, bench: 1 } },
      { id: 'commute', from: 8, to: 9.25, n: [5.2, 3.4], mix: { busrider: 4, brisk: 1.6, newsboy: 1.5, dogwalker: 1.5, worker: 1, bench: 0.6 } },
      // (WSP — the owner, Nov 1: "a few more people in the daytime … some standing still — chatting, waiting, looking at the water": the
      //  three daytime periods ~+1.3 on screen, the weights leaning to the ones who stand — the chat (meet), the railing (water), a window)
      { id: 'morning', from: 9.25, to: 11.5, n: [4.3, 5.4], mix: { bench: 3, water: 3.4, couple: 2.5, dogwalker: 1.5, window: 2, meet: 2.6, busrider: 1.5, stroller: 0.8, customer: 0.3, newsboy: 0.5 } },
      { id: 'midday', from: 11.5, to: 14, n: [5.8, 6.1], mix: { lunch: 4, bench: 1.2, couple: 2.5, water: 2.8, meet: 3, window: 1.6, busrider: 1.2, stroller: 0.8, brisk: 0.5, customer: 0.3 } },
      { id: 'afternoon', from: 14, to: 16.25, n: [4.1, 5.4], mix: { bench: 3, water: 3.4, couple: 2.5, skyline: 1, dogwalker: 1.5, window: 1.4, meet: 2.6, busrider: 1.2, newsboy: 0.6, stroller: 0.8, customer: 0.3 } },
      { id: 'homeward', from: 16.25, to: 18.5, n: [5.1, 4.6], mix: { busrider: 3.5, homeward: 1.2, couple: 2, bench: 2, water: 1.5, cart: 1.5, meet: 1.5, dogwalker: 1, stroller: 0.6, customer: 0.2 } },
      { id: 'evening', from: 18.5, to: 22, n: [2.5, 3.3], mix: { couple: 3, water: 2, skyline: 1.4, stargazer: 1.5, dogwalker: 1.5, cart: 2, bench: 1.5, meet: 1, stroller: 0.6, jogger: 0.25 } },
      { id: 'late', from: 22, to: 24, n: [2.3, 3.1], mix: { couple: 2, water: 1.5, skyline: 1, lone: 1.5, stargazer: 1, bench: 0.8, straggler: 0.4 } },
      { id: 'night', from: 24, to: 26, n: [1.3, 1.9], mix: { lone: 2, couple: 1, straggler: 0.6, water: 0.5 } },
      ],
      weekendFrom: 17, eveningFrom: 18.5, nightTo: 26, lateWeek: [22, 1], sundaySlow: [8.5, 12.5], mood: { party: 3.2, partyN: 3.3, streetCut: 0.5, weekendN: 1, lateShift: 1, rainCut: 0.55, rainFast: 0.2, stormCut: 0.4, fogSlow: 0.18 } } },
  { id: 'people.jog', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#jogHour', what: 'THE JOGGERS: one every `gap` s in their hours (`hours`; the weekend morning `weekend`)',
    knobs: { gap: [45, 90], hours: [[5.5, 8], [12, 13], [17, 19]], weekend: [8, 10] } },
  { id: 'door.stream', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#streamOf', what: 'THE SIDE DOOR’s GUESTS: in (`inHours`, one every `inGap` s) + out (`outHours`, `outGap`); party nights (`party`) + the weekday late nights (`late`) their own',
    knobs: { gap: 9, inGap: [170, 290], inHours: [18.5, 23.25], outGap: [220, 380], outHours: [21, 25.75], party: { outGap: [95, 165], outHours: [21.5, 26.25] }, late: { outGap: [260, 420], outHours: [22, 25] } } },
  { id: 'party.line', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#LINE', what: 'THE LINE at the door on PARTY NIGHTS: `from` → `to`, a guest arriving every `arrive` s, admitted in batches every `admit` s',
    knobs: { from: 20.6, to: 25.4, arrive: [55, 95], admit: [70, 105] } },
  { id: 'bus', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#busesOf', what: 'THE BUS: `perHour` [min, max] by its band — day (`dayFrom` → `dayTo`), late (the hour after + midnight), night',
    knobs: { perHour: { day: [2, 4], late: [1, 1], night: [0, 0] }, dayFrom: 6, dayTo: 23 } },
  { id: 'roof.crowd', trigger: 'clock', status: 'live', src: 'core/harbor-people.js#roofCrowd', what: 'THE ROOFTOP: a crowd on party nights + summer (`summer` months) weekend nights (`weekendNight` h, full from `full`, a few from `warm`); the gardener (`garden`); someone at the view (`view` h)',
    knobs: { summer: [6, 8], weekendNight: [19, 1], full: [20, 1.5], warm: 19, garden: { from: 9, to: 11.5, months: [4, 10] }, view: [18, 23] } },
  // (PROGRESSION B — THE FIREBALL SEEDED: it used to be Math.random on each phone (~3 a year over the night's hours), which no server could
  // check — now the same rate as a seeded calendar: a fireball night ~perYear times a year, ONE big slow streak at a seeded minute between
  // `from` and `to` (evening hours), the same for every phone in a time zone — core/harbor-fireball.js; a CITY SIGHTING)
  { id: 'sky.fireball', trigger: 'calendar', status: 'live', src: 'core/harbor-fireball.js#fireballOf + screens/harbor/meteors.js', what: 'THE FIREBALL: a big slow green-white streak that breaks up — a few nights a year at a seeded minute after dark (clear skies only)',
    knobs: { perYear: 3, from: 20.5, to: 27.5, len: 6 } },
  { id: 'sky.events', trigger: 'clock', status: 'live', src: 'core/harbor-events.js', what: 'the everyday sky: planes, the helicopter (daily), balloons, birds… by rarity',
    knobs: { slot_s: 90, rarity: { common_slots: 4, daily_per_day: 3, weekly_days: 7, rare_days: 30, legendary_days: 365 } } },
  // (NIGHT-C — THE HELICOPTER, the owner Oct 29 4:13 pm; SKY-A — REWORKED, the owner Oct 30 8:19–8:35 am: the ORIGINAL route back — round
  // the harbor + back around — TWO LOOPS a patrol, every ~30 min at night (3–4 min), hourly by day (2–3 min) — core/harbor-heli.js.
  // dayStarts: the hour a day's list begins (the small hours belong to the evening before); dayEl / nightEl: the sun's elevation (°) that
  // makes a slot a day / a night one; dayEvery: the day chain's gap (h); nightEvery: the night's step (h) + minute: the seeded minute in
  // each step; durDay / durNight: a flight's length (s — the sky lane's hold: ≤ 3 sky slots); loops: circles round the city [day, night];
  // turn: off-screen between passes (s, turning round behind the city); SKY-B — near / nearY / far / farUp / farV / speed / stop / twoStops /
  // roofUp: the circle's shape (screens/harbor/air.js#heliPlan); legendGap / legendLen: the window round tonight's legendary it keeps clear of;
  // MODELS — the owner: "still too small when it's close": near 1.6 → 2.3 (the near pass ~64 pt at 402, the far pass ~a third of it: its
  // size follows its distance))
  { id: 'helicopter.patrol', trigger: 'clock', status: 'live', src: 'core/harbor-heli.js#patrolDay + screens/harbor/air.js', what: 'THE HELICOPTER PATROL: every ~30 min from dusk → ~2 am (a seeded minute, 3–4 min each), hourly by day (2–3 min) — SKY-B: A SLOW CIRCLE ROUND THE CITY, `loops` times [day, night]: the NEAR pass low over the harbor’s water (`near` × the old size, `nearY` down the water band, under every skyline sign), round BEHIND THE TOWERS (the far pass: `far` × 28 pt, `farUp` from the low roofs toward the crowns, `farV` × the speed — the skyline hides it), back; MOVING most of the time at `speed` pt/s; 1–2 STOPS a near pass (`twoStops` the chance of two) where it hovers `stop` s + its searchlight FIXES on a spot — a boat, the far quay’s roofs (it climbs `roofUp` pt), the water, the promenade; party nights: the party’s colours on the beat; skipped in a storm / wind ≥ 14',
    knobs: { dayStarts: 6, firstDay: 8, dayJitter: 0.6, dayEvery: [0.85, 1.15], dayTo: 23, dayEl: 0, nightFrom: 12, nightEvery: 0.5, nightEl: -4, lastNight: 25.5, minute: [2, 14], durDay: 150, durNight: 225, loops: [3, 4], turn: [5, 6], near: 2.3, nearY: 0.15, far: 0.72, farUp: 0.3, farV: 2.2, speed: 38, stop: [5, 5.5], twoStops: [0.35, 0.6], roofUp: 40, legendGap: 600, legendLen: 1500 }, conflicts: ['legendaries', 'party.break'] },
  // (SKY-A — the owner, Oct 30 8:19 am: LOWER + CLOSER over the water, never in front of a sign, sweeping BACK AND FORTH over the crowd; the
  // beam DIFFUSED. sweepPeriod: one back-and-forth of the craft (s); ease: its drift easing in after it arrives + out before it leaves (s))
  { id: 'helicopter.break', trigger: 'event', status: 'off', off: 'SKY-B: OFF by default (the owner, Oct 30 — "turn it off"; back with the baked model) — &force=break-heli',  src: 'core/harbor-heli.js#breakFlight + screens/harbor/air.js', what: 'THE HELICOPTER UP FOR EVERY DANCE BREAK: in from a side `lead` s before the song, LOW over the water in front of the skyline (never in front of a sign), drifting BACK AND FORTH over the dancing crowd + the street spill for the WHOLE song, its soft wide beam on them (the pool swept on the beat, `sweepBeats` beats a side — never a strobe), off the other side',
    knobs: { lead: 16, trail: 18, sweepBeats: 8, sweepPeriod: 22, ease: 5 } },
  // SKY-A — THE BLACKBIRD (core/harbor-blackbird.js; screens/harbor/blackbird.js): ONE flyby, its triggers here. chase: it enters when the
  // F-22s' lead is `jetsAcross` of the way across; solo: ~perMonth a month (a seeded day, from → to local hours), July 4: `july4` passes
  // between july4From → july4To; watcher: `minutes` of visible watching (a gap under pauseMin only pauses the count; longer resets it),
  // counted every `step` s, once a device a day
  // SKY-A — THE LEGENDS' REGISTRY (FR4 asked): every legendary, its trigger, its rarity + its conflicts in ONE place. The numbers MIRROR
  // the code that rolls them (core/harbor-legend.js — moved INTO this table at SCHED; tests/harbor-blackbird.test.mjs checks they agree)
  { id: 'legend.ufo', jack: { id: 'ufo', label: 'UFO', order: 5, card: 'fire', dark: true, len: 40, lane: 'legend', start: 'legend:ufo', crew: true, limit: 'legend', note: 'the abduction (~30 s)' }, trigger: 'calendar', status: 'live', src: 'core/harbor-legend.js#legendNight (LEGEND_P)', registry: true, what: 'THE UFO ABDUCTION: ~1–2 a month, any night, 21:30 → 00:45 (a seeded minute); 30 s — sebslom’s model, the pale green beam over the compass, the witnesses flee', knobs: { from: 21.5, to: 24.75, len: 30, p: 0.05, pool: true, kind: 'ufo', weight: 1, jaw: true, win: [21.5, 24.75], dark: true }, conflicts: ['legend.tr3b', 'raid', 'party.break'] },
  { id: 'legend.tr3b', jack: { id: 'tr3b', label: 'TR-3B', order: 6, card: 'fire', dark: true, len: 95, lane: 'legend', start: 'legend:tr3b', crew: true, limit: 'legend', note: 'the black triangle, the blackout + the jets' }, trigger: 'calendar', status: 'live', src: 'core/harbor-legend.js#legendNight (TR3B_PARTY_P, TR3B_HOURS)', registry: true, what: 'THE TR-3B: ~1.5 a month, PARTY NIGHTS only (Fri / Sat), at the peak (22:09–22:51 · 23:09–23:51 · 00:09–00:30), never a fireworks night; the city drains dark, the craft crosses (its lights light the world), the F-22 vic chases it + THE BLACKBIRD passes them', knobs: { partyP: 0.17, hours: [[22.15, 22.85], [23.15, 23.85], [24.15, 24.5]], notOn: [[7, 4], [12, 31], [1, 1]], pool: true, kind: 'tr3b', weight: 1, jaw: true, win: [19, 24.6], dark: true, len: 44 }, conflicts: ['legend.ufo', 'raid', 'fireworks.party', 'party.break', 'traffic'] },
  { id: 'legend.ghostship', trigger: 'calendar', status: 'live', src: 'core/harbor-holiday.js#ghostShipAt', registry: true, what: 'THE GHOST SHIP: Halloween night only (the legendary of Oct 31 — no UFO / TR-3B that night)',
    knobs: { early: [20.75, 1.0], late: [23, 1.5] } },
  { id: 'legend.flyby', jack: { id: 'flyby', label: 'FLYBY', order: 9, card: 'fire', dark: false, len: 22, lane: 'legend', start: 'flyby', crew: true, limit: 'legend', note: 'F-22s straight across on afterburner' }, trigger: 'calendar', status: 'live', src: 'screens/harbor/skyfx.js#flybyDay', registry: true, what: 'THE SURPRISE FLYBY: ~twice a month, golden hour → 11 pm — F-22s straight across on afterburner (the model)',
    knobs: { p: 0.073, nightShare: 0.72, darkCap: 22.4, darkAfterDusk: 0.6, goldBefore: 1, latest: 23, pool: true, kind: 'flyby', weight: 2, win: [17, 23], len: 8 } },
  // (THE MODELS PASS — THE MOTHMAN, core/harbor-mothman.js + screens/harbor/mothman.js: p = a night's chance (≈ 2 a month once the legendary
  // nights + the night after one of his are taken out); arriveFrom / arriveTo, leaveFrom / leaveTo (hours on the evening's clock: 26 = 2 am);
  // glideIn / glideOut / stutter (s: the glide in to the needle, the glide away, the needle's dark stutter that hides the swap); size (his
  // perched height, pt at 402 — scaled with the screen: 84 = the plan's ~70 pt of HIM above the tip, the hem draping round the spire);
  // on = HIS SWITCH (ATM-A: false — postponed; his code, models + the force previews kept))
  { id: 'legend.mothman', trigger: 'calendar', status: 'off', off: 'ATM-A: POSTPONED (the owner, Oct 31: "looks very cheap, needs major work" — the FUTURE list); no nights while knobs.on is false — &force=mothman / mothman-arrive / mothman-leave still preview him', src: 'core/harbor-mothman.js#mothmanNight + screens/harbor/mothman.js', registry: true, what: 'THE MOTHMAN on THE NEON NEEDLE: ~twice a month, never a legendary night or two nights running — glides in ~2–2:30 am (the needle stutters dark: he is perched), the eyes blinking out of sync, leaves ~5–5:30 (the needle stutters: he is already in the air, gliding up + away — no flaps)', knobs: { on: false, p: 0.075, arriveFrom: 26, arriveTo: 26.5, leaveFrom: 29, leaveTo: 29.5, glideIn: 14, glideOut: 16, stutter: 1.4, size: 84 }, conflicts: ['legend.ufo', 'legend.tr3b', 'window.haze'] },
  { id: 'legend.rule', trigger: 'event', status: 'live', src: 'core/harbor-legend.js#legendNight', registry: true, what: 'THE LEGENDS’ RULES: never two legendaries a night, never two legendary nights running; a raid never shares its night; nothing new drives in while one runs (trafficHold); no dance break during one',
    knobs: { ghostNight: [[10, 31]] } },
  { id: 'blackbird.chase', trigger: 'event', status: 'live', src: 'core/harbor-blackbird.js#bbChaseAt + screens/harbor/blackbird.js', what: 'THE BLACKBIRD IN EVERY TR-3B CHASE: once the F-22s are ~⅓ across, the same direction, faster — across the dark NEON sign while the drain holds it (above it if it’s powering back)', knobs: { jetsAcross: 1 / 3 } },
  { id: 'blackbird.solo', jack: { id: 'blackbird', label: 'BLACKBIRD', order: 8, card: 'fire', dark: false, len: 25, lane: 'legend', start: 'blackbird', crew: true, limit: 'legend', note: 'the SR-71 screams across' }, trigger: 'calendar', status: 'live', src: 'core/harbor-blackbird.js#soloDay', what: 'THE BLACKBIRD’s SOLO SIGHTINGS: rare (~2 a month, a seeded day + time), ~5 passes on July 4 — above the lit sign; never on a legendary night', knobs: { perMonth: 2, from: 11, to: 23, july4: 5, july4From: 12, july4To: 21.5, pool: true, kind: 'blackbird', weight: 2, win: [11, 23], lunch: [12, 13], len: 9 }, conflicts: ['legendaries'] },
  { id: 'blackbird.watcher', trigger: 'event', status: 'live', src: 'core/harbor-blackbird.js#watcherStep', what: 'THE WATCHER’s REWARD: after 60 visible minutes on the city (a gap under 5 min pauses the count, longer resets it) — this device only, once a day, never announced', knobs: { minutes: 60, pauseMin: 5, step: 5 } },
  // (SKY-B — THE SHADOWBOXER, core/harbor-boxer.js + screens/harbor/boxer.js: days (0 = Sun); from / to / wrapAt (local hours); stayChance (a
  // party night — Fri + Sat, partyDays — he trains on through the party); round / rest / brk (s) + rounds a set; walkIn / outWalk (s: in at a set's start, the towel +
  // out at the end); blindLead / blindDown (s: the blind up before him, down after); lampOff (s: the bulb out after the blind is down);
  // height (his share of the window's height); bagKick / bulbKick (rad a full hit); ropeBursts (the rope heard in a long break))
  { id: 'boxer', trigger: 'calendar', status: 'live', src: 'core/harbor-boxer.js + screens/harbor/boxer.js', what: 'THE SHADOWBOXER: EVERY NIGHT 7 → 11 pm in the upper middle window (the blind up, then he WALKS UP into place = his entrance), SETS of 10 ROUNDS (3 min) + 1-min rests → a 10-min break → again; at 11 he finishes the set; the PARTY NIGHTS (Fri + Sat, each seeded by the date ~50/50) he wraps up at 8:30 (the round he is in — the towel, the walk out, the blind down) or trains on through the party; never during a raid or on a legendary night (the owner, Oct 31 8:32 pm: every night — was Mon / Wed / Fri)',
    knobs: { days: [0, 1, 2, 3, 4, 5, 6], partyDays: [5, 6], from: 19, to: 23, wrapAt: 20.5, stayChance: 0.5, round: 180, rest: 60, rounds: 10, brk: 600, walkIn: 3.5, outWalk: 7, blindLead: 3.5, blindDown: 3.5, lampOff: 90, height: 0.7, bagKick: 0.12, bulbKick: 0.07, ropeBursts: 6 }, conflicts: ['window.party', 'raid', 'legendaries'] },
  // ---- WINDOWS (the owner, Nov 1 8:33 pm — DECIDED: "everything timed goes on the one city schedule"): THE WINDOW SCENES ARE ROWS HERE —
  // no separate rotation system. A FIXED-SLOT scene: its window (core/harbor-speakeasy.js ROOMS: bar = the bottom middle, jazz = the bottom
  // right, back = the top middle), its hours (from → to: the shade starts up at `from`, the shade is all the way down again at `to` — his
  // walk-in + his exit + pulling the shade happen INSIDE them), its nights (days: 0 = Sun; [] = every night) + rarity (p: a night's chance).
  // A ROTATING scene (rotate: true — THE BOOKIE first): seeded per night (every phone the same) — `p` a night's chance, `days` the nights it
  // may come, `slots` the window + hours it may take, the first slot that clears every fixed row (+ the boxer) in that window. A NEW SCENE =
  // a new row + its painter (core/harbor-scenes.js#SCENE_IDS). The conflicts: core/harbor-scenes.js#sceneClashes (a test: none).
  // glow: the room's light through its drawn shade after hours (the quiet hours' patchwork: amber · a cold white SWAYING bulb · banker's green · rosy)
  { id: 'scene.juggler', trigger: 'calendar', status: 'live', src: 'core/harbor-scenes.js + core/harbor-juggler.js + screens/harbor/juggler.js', what: 'THE JUGGLER: the bottom-right window every night 6:30 → 9:30 pm — the shade up, he walks in from the side with his bag, takes out the balls, starts slow; cascades, showers, faster runs, a trick, now + then a DROP (the ball thuds, bounces + rolls, he picks it up + restarts), a rest (sits, wipes his brow, drinks); at the end he catches all three, a flourish, packs the bag, walks out + pulls the shade (amber behind it). ONE warm amber lamp low + to one side, a plain wall; NEON balls every night (magenta · yellow · orange), pulsing on the beat on party nights',
    knobs: { win: 'jazz', from: 18.5, to: 21.5, days: [], p: 1, glow: [232, 122, 64] }, conflicts: ['scene.crate', 'window.party', 'raid', 'legendaries'] },
  { id: 'scene.crate', trigger: 'calendar', status: 'live', src: 'core/harbor-scenes.js + core/harbor-crate.js + screens/harbor/crate.js', what: 'THE CRATE GUY: the bottom-right window 9:45 pm → midnight (after the juggler’s shade) — he backs in carrying the first crate; carries crates in + STACKS them in the corner (THE PILE GROWS over his shift), now + then pries one open with the crowbar + holds ONE bottle up against the bulb, wipes his brow, listens at the window, a rare swig; at the end he sits on his pile, a cigarette’s ember, pulls the shade. ONE BARE BULB on a cord (cold white), swinging — a crate set down bumps it',
    knobs: { win: 'jazz', from: 21.75, to: 24, days: [], p: 1, glow: [214, 228, 255], sway: true }, conflicts: ['scene.juggler', 'window.party', 'raid', 'legendaries'] },
  { id: 'scene.charleston', trigger: 'calendar', status: 'live', src: 'core/harbor-scenes.js + core/harbor-charleston.js + screens/harbor/charleston.js', what: 'THE CHARLESTON: the bottom-middle window 7 → 10 pm — she walks in, sets the needle on the phonograph, kicks off her heels, starts: a REHEARSAL (big kicks, crossing knees, swinging arms, a breather, fixing a shoe, a combination tried again + nailed, now + then the laughing collapse into the chair); at the end the collapse into the chair, she fans herself + pulls the shade. A ROSY fringed lamp — she is LIT, a bright fringe dress swinging with the kicks',
    knobs: { win: 'bar', from: 19, to: 22, days: [], p: 1, glow: [255, 150, 170] }, conflicts: ['window.party', 'raid', 'legendaries'] },
  { id: 'scene.bookie', trigger: 'calendar', status: 'live', src: 'core/harbor-scenes.js + core/harbor-bookie.js + screens/harbor/bookie.js', what: 'THE BOOKIE (the first ROTATING scene): his window + nights seeded (never over a fixed slot, never a party night) — he walks in, hangs his hat, sits, CLICKS THE GREEN LAMP ON; takes bets all night (the candlestick phone, pacing with the receiver at his head, writing, counting); RARELY a call goes bad → slams the phone + throws his hat, picks it up; at the end the cash in a bag, hat on, pulls the shade, leaves. A GREEN-SHADED DESK LAMP, his face lit from below, a cigar ember + its smoke in the beam',
    knobs: { rotate: true, p: 0.6, days: [0, 1, 2, 3, 4], glow: [120, 230, 140], slots: [{ win: 'bar', from: 22.25, to: 25.5 }, { win: 'back', from: 23.25, to: 26 }, { win: 'jazz', from: 24.25, to: 26.5 }] }, conflicts: ['window.party', 'raid', 'legendaries'] },
  // (AFTER HOURS: a scene room's shade down + its room's light through it whenever no scene is in — dusk → its LIGHTS OUT, one window at a
  // time between outFrom → outTo (seeded, ≥ gap s apart; the click: off, a flash, off); then a dark shade until the dawn takes it up again.
  // The boss's nightlight keeps the building never fully dark. crossfade: the shade's colour blends to the next scene's room (s before its shade-up))
  { id: 'windows.shades', trigger: 'darkness', status: 'live', src: 'core/harbor-scenes.js#shadesNight + screens/harbor/windows.js', what: 'AFTER HOURS — THE PATCHWORK OF COLOURED SHADES: at night the scene rooms (the bottom middle, the bottom right, the top middle) keep their shades DOWN whenever no scene is in, glowing in their room’s colour; the lights go out ONE AT A TIME ~2–4 am; the boss’s nightlight until dawn',
    knobs: { outFrom: 26, outTo: 28, gap: 900, crossfade: 60 }, conflicts: ['window.party'] },
  // (THE OLD SCENES RETIRED — the owner, Nov 1 10:54 am: "not up to the standard of the new scenes — I don't want to use those at all": the
  // bartender + the bar, the toast, the sax, the dancing couple, the tango, the peek, the cash count, the card game, every holiday window
  // scene — OFF, their code kept: `on: true` (or &force=old-windows, the panel's row) brings them back + the old quiet building)
  { id: 'windows.old', trigger: 'event', status: 'off', off: 'WINDOWS: RETIRED (the owner, Nov 1) — &force=old-windows previews them', src: 'core/harbor-moments.js#RETIRED + screens/harbor/windows.js', what: 'THE OLD WINDOW SCENES (retired)', knobs: { on: false } },
  // ---- CITY CONTROLS A — THE RADIO (core/harbor-radio.js; the owner, Nov 2 8:05–10:05 am — DECIDED): a row with a `jack` is a PATCH JACK on
  // the owner's desk (plug and play: a new moment = its row). jack: { id, label, order (on the desk), card ('fire' · 'words' · 'fireworks' ·
  // 'dance' · 'billboard'), dark (after dark only — the city's time ALWAYS follows the real clock), len (s it runs — the lamp's PINK),
  // lane (ONE at a time per lane: 'legend' · 'words' · 'show'; 'free' = no queue; a legend + a show never overlap), start (how the city
  // plays it ONCE: 'legend:<kind>' · 'flyby' · 'blackbird' · 'fireworks' · 'words' · 'banner' · 'balloons' · 'lightning' · 'hold:<force id>'
  // = held on for len), crew (THE CREW's desk has it), limit (the crew's per-night count it draws on) }
  // radio: lead (s from FIRE to the start: a room ~2 s; the whole city ~45 s — the phones' cached poll; JUST ME at once), gap (s between two in
  // a lane), darkEl (the sun's elevation that is "after dark"), home (where the server judges the dark: the owner's city), words (the letters a
  // message may have), queueMax, crew: THE CREW (CC-B grants it): cap (friends), cooldown (s after a moment ends), perNight (each limit's
  // count a ROOM may fire a night), nightFrom (the local hour a "night" starts for the counts)
  { id: 'radio', trigger: 'event', status: 'live', src: 'core/harbor-radio.js + api/admin.js#radio', what: 'THE RADIO: the owner fires the city’s moments (the jacks below), the server checks the role + the rules + writes the queue + the audit log; phones play each one ONCE at its start',
    knobs: { lead: { me: 0.6, room: 2, city: 45 }, gap: 4, darkEl: -6, home: { lat: 42.96, lon: -85.67, tz: 'America/Detroit' }, words: 24, queueMax: 12, keep: 172800,
      crew: { cap: 10, cooldown: 60, nightFrom: 12, perNight: { legend: 3, words: 10, fireworks: 3, lightning: 10, lights: 10, beams: 10, balloons: 10 } } } },
  // CITY CONTROLS B — THE INTERCOM (docs/harbor/passes/city-controls-b.md): the owner's voice → every phone. maxS the longest recording (s), maxKB
  // the clip's size cap (KB — ~48 kbps × 30 s ≈ 180 KB), lead (s from SEND to the start: a lobby's phones start TOGETHER), keep (s the clip lives
  // on the server — a phone in a game holds it this long), unsend (s the UNSEND button stays — "until every phone would have it": the ~45 s
  // poll), late (s past its end a title phone still plays one that arrived late), duck (the music's level under the voice), head (letters)
  { id: 'radio.intercom', trigger: 'event', status: 'live', src: 'core/radio-intercom.js + api/_lib/radio.js#intercom + audio/intercom.js', what: 'THE INTERCOM: the owner records up to `maxS` s → PLAY BACK · SEND · DISCARD; the chime → the music ducks → the voice through a 1920s PA → the chime; JUST ME · LOBBY ONLY · EVERYONE; WAIT FOR THE LOBBY or not; UNSEND for `unsend` s',
    // (FRIENDS A — THE CREW INTERCOM: `crew` = the crew's hold-to-talk in THEIR OWN ROOM, behind the owner's master switch (radio/crewIc, default OFF):
    //  ≤ maxS s a clip, perNight clips a room a night; the clips go after `keep` like the owner's)
    // (FRIENDS C — THE INTERCOM IN SYNC: EVERYONE's `lead` 2 → 50 s — every phone (the city's ~45 s poll, every lobby, the owner's own) starts it
    //  at that one moment on the server clock; `late` (150 s from the top) retired — a late phone joins mid-way: core/radio-intercom.js#icDecide)
    knobs: { maxS: 30, minS: 0.6, maxKB: 600, kbps: 48, lead: { me: 0.5, room: 2.5, everyone: 50 }, keep: 3600, unsend: 60, duck: 0.2, head: 24, crew: { maxS: 15, perNight: 4 } } },
  { id: 'radio.skywrite', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf + screens/harbor/scene-radio.js', jack: { id: 'skywrite', label: 'SKYWRITE', order: 1, card: 'words', dark: false, len: 80, lane: 'words', start: 'words', crew: true, limit: 'words', note: 'skytyped in the smoke colour you pick by day, the drone show after dark (in your colours)' }, what: 'THE RADIO’s SKYWRITE: up to 24 letters' },
  { id: 'radio.banner', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf', jack: { id: 'banner', label: 'BANNER', order: 2, card: 'words', dark: false, len: 70, lane: 'words', start: 'banner', crew: true, limit: 'words', note: 'the banner plane towing your words' }, what: 'THE RADIO’s BANNER: up to 24 letters' },
  { id: 'radio.searchlights', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf', jack: { id: 'lights', label: 'LIGHTS', order: 4, card: 'fire', dark: true, len: 180, lane: 'free', start: 'hold:searchlights', crew: true, limit: 'lights', note: 'the searchlights sweeping the sky (3 min)' }, what: 'THE RADIO’s SEARCHLIGHTS' },
  { id: 'radio.balloons', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf', jack: { id: 'balloons', label: 'BALLOONS', order: 11, card: 'fire', dark: false, len: 600, lane: 'free', start: 'balloons', crew: true, limit: 'balloons', note: 'a hot-air balloon flight drifting across' }, what: 'THE RADIO’s BALLOONS' },
  { id: 'radio.billboard', trigger: 'event', status: 'live', src: 'core/harbor-billboard.js#hintsAt (the owner’s messages) + api/admin.js', jack: { id: 'billboard', label: 'BILLBOARD', order: 12, card: 'billboard', dark: false, len: 0, lane: 'free', start: 'billboard', note: 'two short lines on the speakeasy’s billboard — now, at a time, or every week' },
    what: 'THE OWNER’s BILLBOARD MESSAGES (the queue’s kind ‘text’): two short lines take the whole board for `show` s every `every` s inside their window (`len` min from their start), above the hints',
    knobs: { len: 120, show: 25, every: 60, prio: 50, line: 12 , bridge: 5} },
  { id: 'radio.lightning', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf + screens/harbor/stormcell.js', jack: { id: 'lightning', label: 'LIGHTNING', order: 13, card: 'fire', dark: false, len: 26, lane: 'free', start: 'lightning', crew: true, limit: 'lightning', note: 'a strike — on a clear sky a dark storm cell rolls in from upwind first' },
    what: 'THE RADIO’s LIGHTNING: in a storm / rain 1–3 close strikes; on a clear sky a brief storm cell rolls in from upwind (`rollIn` s), strikes `strikes` times on the lighthouse or a tower’s rod, rolls away (`len` s in all)',
    knobs: { rollIn: 3.5, strikes: [1, 3], firstAt: 5, between: [4.6, 6.5], len: 24, rollAway: 6 } },
  { id: 'radio.beams', trigger: 'event', status: 'live', src: 'core/harbor-radio.js#startOf', jack: { id: 'beams', label: 'SKY BEAMS', order: 14, card: 'fire', dark: true, len: 180, lane: 'free', start: 'hold:beams', crew: true, limit: 'beams', note: 'the party’s beams up from the tall towers (3 min)' }, what: 'THE RADIO’s SKY BEAMS' },
  { id: 'legendaries', trigger: 'event', status: 'live', src: 'core/harbor-legend.js', what: 'the legendaries (the UFO, the TR-3B…) — their seeded nights', conflicts: ['traffic'] },
  { id: 'blackout', trigger: 'event', status: 'live', src: 'core/harbor-dark.js', what: 'THE BLACKOUT (the TR-3B\'s drain): every light down, back on in turn' },
  { id: 'raid', trigger: 'event', status: 'live', src: 'core/harbor-raid.js', what: 'THE RAID: the night after a bootlegger delivery (~50 %), 9–11 pm', conflicts: ['party.break'],
    knobs: {
      window: [21.33, 22.75],
      after: 0.5,
      party: 0.12,
    } },
]);

/** THE CONFLICTS — what can never happen at the same time, in ONE place (the owner, 9:11 pm): `rule` = who gives way; `where` = the code */
export const CONFLICTS = Object.freeze([
  { a: 'legendaries', b: 'traffic', rule: 'no vehicle ENTERS during a legendary (one on screen finishes its business)', where: 'core/harbor-legend.js#trafficHold' },
  { a: 'party.break', b: 'traffic.front', rule: 'the front street holds its traffic for a dance break (the spill\'s lead → its trail): nothing enters, what\'s there drives on', where: 'core/harbor-streetparty.js#streetHold' },
  { a: 'party.break', b: 'cabstand', rule: 'no cab-stand waiter sits down in a break (the bench is the dancers\'); the taxi waits', where: 'core/harbor-streetparty.js#breakNear' },
  { a: 'raid', b: 'party.break', rule: 'no dance break while the raid runs (the break is skipped)', where: 'core/harbor-streetparty.js#danceBreaks (ctx.blocked)' },
  { a: 'legendaries', b: 'party.break', rule: 'no dance break during a legendary (skipped)', where: 'core/harbor-streetparty.js#danceBreaks (ctx.blocked)' },
  { a: 'helicopter.break', b: 'party.break', rule: 'the helicopter is UP for every dance break — the whole song, over the crowd', where: 'core/harbor-heli.js#breakFlight · screens/harbor/air.js#breakFly' },
  { a: 'helicopter.patrol', b: 'party.break', rule: 'no patrol over a dance break (the break has the helicopter)', where: 'core/harbor-heli.js#patrolsNear (ctx.blocked)' },
  { a: 'helicopter.patrol', b: 'legendaries', rule: 'no patrol near tonight’s legendary (its window: legendGap before → legendLen after)', where: 'core/harbor-heli.js#legendWindow' },
  { a: 'blackbird.solo', b: 'legendaries', rule: 'no solo Blackbird on a legendary night (that night has its own sky; the TR-3B brings its own Blackbird)', where: 'core/harbor-blackbird.js#soloDay' },
  { a: 'blackbird', b: 'traffic', rule: 'nothing new crosses the sky strip while it flies (one flyby at a time, a forced one waits)', where: 'screens/harbor/blackbird.js#start' },
  { a: 'fireworks.show', b: 'storm', rule: 'no fireworks in rain, a storm, a gale, dense fog or heavy snow (light snow + clear cold nights go ahead); a show that turns bad stops launching', where: 'core/harbor-fireworks.js#fireworksWeather · screens/harbor/fireworks.js' },
  { a: 'fireworks.show', b: 'legendaries', rule: 'a show WAITS for tonight’s legendary / the ghost ship / the raid (its gap after it); never launched while one runs', where: 'core/harbor-fireworks.js#fireworksNight (ctx.busy)' },
  { a: 'fireworks.party', b: 'party.break', rule: 'no dance break during a show — the dancers STOP + look up (the break is skipped)', where: 'core/harbor-streetparty.js#danceBreaks (ctx.blocked) · scene.js' },
  { a: 'fireworks.show', b: 'helicopter.patrol', rule: 'no patrol over a show (the sky is the fireworks’)', where: 'core/harbor-heli.js#patrolsNear (ctx.blocked) · scene.js' },
  { a: 'boxer', b: 'window.party', rule: 'the boxer\'s window sits out of the window party when he trains on a party night', where: 'screens/harbor/windows.js (party.k.back = 0 while he is in)' },
  { a: 'boxer', b: 'raid', rule: 'a raid ends his night (the blinds come down)', where: 'screens/harbor/windows.js (boxer off once raidS ≥ 0)' },
  { a: 'legend.mothman', b: 'window.haze', rule: 'EYES IN THE HAZE never shares a Mothman night (nor a legendary’s)', where: 'core/harbor-moments.js#eyesNights (mothmanNight)' },
  { a: 'boxer', b: 'legendaries', rule: 'no training on a legendary’s night', where: 'core/harbor-boxer.js#boxerNight (o.legend)' },
  { a: 'scene.juggler', b: 'scene.crate', rule: 'ONE SCENE A WINDOW: the juggler pulls his shade at 9:30, the shade glows amber till 9:45, then the crate guy’s shade goes up', where: 'core/harbor-scenes.js#sceneClashes (a test: the fixed rows never overlap in a window)' },
  { a: 'scene.bookie', b: 'scene.juggler', rule: 'a rotating scene never takes a window a fixed scene (or the boxer) holds that night — it takes the first free slot or stays home', where: 'core/harbor-scenes.js#scenesTonight' },
  { a: 'scene.juggler', b: 'window.party', rule: 'a scene room joins the window party only after its last scene of the night has ended (its shade then goes up for the party); the bookie never comes on a party night', where: 'screens/harbor/windows.js (sceneFree)' },
  { a: 'scene.juggler', b: 'raid', rule: 'a raid ends every scene (the shades drop)', where: 'screens/harbor/windows.js' },
  { a: 'scene.juggler', b: 'legendaries', rule: 'no scene on a legendary’s night when it falls inside the scene’s hours (as the boxer)', where: 'core/harbor-scenes.js#scenesTonight (o.legend)' },
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
    for (const [n, v] of Object.entries(k)) bits.push(typeof v === 'number' && /^(from|to|warm|full|thin|gone|at|midnight|partyTo)$/.test(n) ? `${n} ${hh(v)}` : `${n} ${v && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) ? v.map(x => (x && typeof x === 'object' ? JSON.stringify(x) : x)).join('/') : v}`);
    return `${r.trigger.toUpperCase().padEnd(8)} ${r.id.padEnd(18)} ${r.status === 'planned' ? '(planned) ' : r.status === 'off' ? '(OFF) ' : ''}${r.fixed ? '(FIXED) ' : ''}${r.what}${bits.length ? ` — ${bits.join(' · ')}` : ''}${r.conflicts ? ` · never with: ${r.conflicts.join(', ')}` : ''}  [${r.src}]`;
  };
  const order = TRIGGERS;
  const rows = [...SCHEDULE].sort((a, b) => order.indexOf(a.trigger) - order.indexOf(b.trigger));
  return ['THE CITY TIMETABLE', ...rows.map(fmt), '', 'THE CONFLICTS', ...CONFLICTS.map(c => `${c.a} × ${c.b}: ${c.rule}  [${c.where}]`)].join('\n');
}
