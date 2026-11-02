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
  // (NIGHT-C — THE SAME PARTY SONG ON EVERY PHONE, the owner Oct 30: the City 2.0 PARTY deck itself on the server clock — core/party-deck.js,
  // audio/party-music.js; fastBpm: a song at or above it is a FAST one for the dance kinds; len + fast: the stand-in when the songs aren't loaded)
  { id: 'party.songs', trigger: 'beat', status: 'live', src: 'core/party-deck.js + core/harbor-streetparty.js#partyTimeline', what: 'THE PARTY SONGS ON THE SERVER CLOCK: the PARTY deck seeded by the evening, back to back from 8 pm — every phone hears the same song at the same moment (a phone joining mid-song lands in place); the panel\'s PARTY plays the epoch\'s deck, &force=dance a deck from the force moment',
    knobs: { from: 20, to: 26.6, fastBpm: 110, len: [185, 250], fast: 0.55 } },
  { id: 'party.break', trigger: 'beat', status: 'live', src: 'core/harbor-streetparty.js#danceBreaks', what: 'A DANCE BREAK ~every 20 min: ONE SONG where almost everyone dances, starting ON the start of the party song every phone hears (seeded)',
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
  { id: 'fireworks.show', trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#weeknightScript', what: 'THE WEEKNIGHT SHOW: a short show (~60–90 s, a few dozen shells) at 9:30 pm on every night that is not a party night — the sign dims, the people look up',
    knobs: { at: 21.5, latest: 23.4, gap: 120, darkEl: -7.5, dur: [62, 88], dim: 0.06, cancel: { rain: 0.12, wind: 16, fog: 0.55, snow: 0.5 } },
    conflicts: ['legendaries', 'raid', 'storm', 'helicopter.patrol'] },
  { id: 'fireworks.party', trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#partyScript', what: 'THE PARTY SHOW: the full show (~4–5 min) at 10 pm on a party night, building to a FINALE (a full sky) + THE GOLD WILLOW CURTAIN over the skyline; synced to the party song; the dancers stop + look up',
    knobs: { at: 22.0, latest: 23.6, gap: 150, dur: [250, 290], finale: 40 },
    conflicts: ['legendaries', 'raid', 'storm', 'party.break', 'helicopter.patrol'] },
  { id: 'fireworks.midnight', trigger: 'clock', status: 'live', src: 'core/harbor-fireworks.js#midnightScript', what: 'MIDNIGHT: 2–4 shells, low (below the sign, no dim) — "someone setting off a few"; every night',
    knobs: { at: 24.0, latest: 24.6, gap: 60, n: [2, 4] }, conflicts: ['legendaries', 'storm'] },
  // ---- FIXED POINTS
  { id: 'rosie.bell', trigger: 'clock', status: 'live', fixed: true, src: 'core/harbor-boats.js', what: 'ROSIE\'s ship\'s bell as she docks at :00 (the horn ~:03 as she casts off) — the owner: NEVER moved',
    knobs: { minute: 0 } },
  // ---- THE REST OF THE CITY (rows to SEE the whole day; their times live in `src` until SCHED migrates them)
  { id: 'lamps', trigger: 'darkness', status: 'live', src: 'core/harbor-lamps.js', what: 'the implied lamps + the beacons: the photocell at dusk, off at dawn',
    knobs: { from: 0.08, to: 0.55, warm: 1.3, slot: 420, chance: 0.5, out: 0.22, outS: [3, 6] } },
  { id: 'windows.dusk', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js', what: 'the speakeasy\'s windows light at dusk; late at night they go out one by one' },
  // (NIGHT-C — THE QUIET BUILDING, the owner Oct 29 5:52 pm: from the rooms' dusk to the dawn, not on a party night; litMin / litMax: how
  // many of the three parked rooms are lit behind their blinds tonight; outFrom / outTo: the lit ones' lamps going out, one by one)
  { id: 'windows.parked', trigger: 'darkness', status: 'live', src: 'core/harbor-moments.js#parkedNight + screens/harbor/windows.js', what: 'THE QUIET BUILDING: at night only the boss’s TV room + the two cut-off side rooms stay live; the bar, the jazz room + the upper middle (the boxer’s — SKY) PARKED behind drawn blinds, a mix of warm-lit + dark, going out one by one; party nights unchanged',
    knobs: { litMin: 1, litMax: 2, outFrom: 22.25, outTo: 25.5 }, conflicts: ['window.party'] },
  { id: 'signs.modes', trigger: 'clock', status: 'live', src: 'core/harbor-roofmodes.js', what: 'the roof signs\' hourly modes (spell / race / breath)',
    knobs: { minute: 60, slot: 15 } },
  { id: 'party.pulse', trigger: 'beat', status: 'live', src: 'core/harbor-beat.js', what: 'the party pulse: the lights on the song\'s grid (a trusted grid always punches)' },
  { id: 'holidays', trigger: 'calendar', status: 'live', src: 'core/harbor-holiday.js', what: 'the holidays, their build-ups day by day + the sign dressings' },
  { id: 'workers', trigger: 'clock', status: 'live', src: 'core/harbor-workers.js', what: 'the workers\' day (milk 6:00, newsboy 7:00, barber 8:30, the beat cop 9 am + 9 pm…)' },
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
  { id: 'sky.events', trigger: 'clock', status: 'live', src: 'core/harbor-events.js', what: 'the everyday sky: planes, the helicopter (daily), balloons, birds… by rarity' },
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
  { id: 'legend.ufo', trigger: 'calendar', status: 'live', src: 'core/harbor-legend.js#legendNight (LEGEND_P)', registry: true, what: 'THE UFO ABDUCTION: ~1–2 a month, any night, 21:30 → 00:45 (a seeded minute); 30 s — sebslom’s model, the pale green beam over the compass, the witnesses flee', knobs: { from: 21.5, to: 24.75, len: 30 }, conflicts: ['legend.tr3b', 'raid', 'party.break'] },
  { id: 'legend.tr3b', trigger: 'calendar', status: 'live', src: 'core/harbor-legend.js#legendNight (TR3B_PARTY_P, TR3B_HOURS)', registry: true, what: 'THE TR-3B: ~1.5 a month, PARTY NIGHTS only (Fri / Sat), at the peak (22:09–22:51 · 23:09–23:51 · 00:09–00:30), never a fireworks night; the city drains dark, the craft crosses (its lights light the world), the F-22 vic chases it + THE BLACKBIRD passes them', knobs: { partyP: 0.17, hours: [[22.15, 22.85], [23.15, 23.85], [24.15, 24.5]] }, conflicts: ['legend.ufo', 'raid', 'fireworks.party', 'party.break', 'traffic'] },
  { id: 'legend.ghostship', trigger: 'calendar', status: 'live', src: 'core/harbor-holiday.js#ghostShipAt', registry: true, what: 'THE GHOST SHIP: Halloween night only (the legendary of Oct 31 — no UFO / TR-3B that night)' },
  { id: 'legend.flyby', trigger: 'calendar', status: 'live', src: 'screens/harbor/skyfx.js#flybyDay', registry: true, what: 'THE SURPRISE FLYBY: ~twice a month, golden hour → 11 pm — F-22s straight across on afterburner (the model)' },
  // (THE MODELS PASS — THE MOTHMAN, core/harbor-mothman.js + screens/harbor/mothman.js: p = a night's chance (≈ 2 a month once the legendary
  // nights + the night after one of his are taken out); arriveFrom / arriveTo, leaveFrom / leaveTo (hours on the evening's clock: 26 = 2 am);
  // glideIn / glideOut / stutter (s: the glide in to the needle, the glide away, the needle's dark stutter that hides the swap); size (his
  // perched height, pt at 402 — scaled with the screen: 84 = the plan's ~70 pt of HIM above the tip, the hem draping round the spire);
  // on = HIS SWITCH (ATM-A: false — postponed; his code, models + the force previews kept))
  { id: 'legend.mothman', trigger: 'calendar', status: 'off', off: 'ATM-A: POSTPONED (the owner, Oct 31: "looks very cheap, needs major work" — the FUTURE list); no nights while knobs.on is false — &force=mothman / mothman-arrive / mothman-leave still preview him', src: 'core/harbor-mothman.js#mothmanNight + screens/harbor/mothman.js', registry: true, what: 'THE MOTHMAN on THE NEON NEEDLE: ~twice a month, never a legendary night or two nights running — glides in ~2–2:30 am (the needle stutters dark: he is perched), the eyes blinking out of sync, leaves ~5–5:30 (the needle stutters: he is already in the air, gliding up + away — no flaps)', knobs: { on: false, p: 0.075, arriveFrom: 26, arriveTo: 26.5, leaveFrom: 29, leaveTo: 29.5, glideIn: 14, glideOut: 16, stutter: 1.4, size: 84 }, conflicts: ['legend.ufo', 'legend.tr3b', 'window.haze'] },
  { id: 'legend.rule', trigger: 'event', status: 'live', src: 'core/harbor-legend.js#legendNight', registry: true, what: 'THE LEGENDS’ RULES: never two legendaries a night, never two legendary nights running; a raid never shares its night; nothing new drives in while one runs (trafficHold); no dance break during one' },
  { id: 'blackbird.chase', trigger: 'event', status: 'live', src: 'core/harbor-blackbird.js#bbChaseAt + screens/harbor/blackbird.js', what: 'THE BLACKBIRD IN EVERY TR-3B CHASE: once the F-22s are ~⅓ across, the same direction, faster — across the dark NEON sign while the drain holds it (above it if it’s powering back)', knobs: { jetsAcross: 1 / 3 } },
  { id: 'blackbird.solo', trigger: 'calendar', status: 'live', src: 'core/harbor-blackbird.js#soloDay', what: 'THE BLACKBIRD’s SOLO SIGHTINGS: rare (~2 a month, a seeded day + time), ~5 passes on July 4 — above the lit sign; never on a legendary night', knobs: { perMonth: 2, from: 11, to: 23, july4: 5, july4From: 12, july4To: 21.5 }, conflicts: ['legendaries'] },
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
    knobs: { win: 'jazz', from: 18.5, to: 21.5, days: [], p: 1, glow: [255, 176, 92] }, conflicts: ['scene.crate', 'window.party', 'raid', 'legendaries'] },
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
    for (const [n, v] of Object.entries(k)) bits.push(typeof v === 'number' && /^(from|to|warm|full|thin|gone|at|midnight|partyTo)$/.test(n) ? `${n} ${hh(v)}` : `${n} ${Array.isArray(v) ? v.join('/') : v}`);
    return `${r.trigger.toUpperCase().padEnd(8)} ${r.id.padEnd(18)} ${r.status === 'planned' ? '(planned) ' : r.status === 'off' ? '(OFF) ' : ''}${r.fixed ? '(FIXED) ' : ''}${r.what}${bits.length ? ` — ${bits.join(' · ')}` : ''}${r.conflicts ? ` · never with: ${r.conflicts.join(', ')}` : ''}  [${r.src}]`;
  };
  const order = TRIGGERS;
  const rows = [...SCHEDULE].sort((a, b) => order.indexOf(a.trigger) - order.indexOf(b.trigger));
  return ['THE CITY TIMETABLE', ...rows.map(fmt), '', 'THE CONFLICTS', ...CONFLICTS.map(c => `${c.a} × ${c.b}: ${c.rule}  [${c.where}]`)].join('\n');
}
