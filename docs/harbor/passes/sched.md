# SCHED — Nov 2 2026

The owner's DESKTOP review fixes + THE CITY TIMETABLE's migration (every older timed system moved in) + the rest of THE scene.js SPLIT + THE
NEW SCHEDULE (the SHOWCASE DIAL, prime time, the legendaries' rate) + THE BILLBOARD's HINTS + THE DAY CHART (plan.md "OWNER'S NOTES — NOV 2";
decisions.md §1, §7, §9, §12, §15). One session, the groups in order, each committed + pushed; the final push carries the harbor tag.

## What changed

### Group 0 — the owner's DESKTOP review
- **THE JUGGLER back to his warm AMBER room** (juggler.js — the lamp low + to one side as WINDOWS shipped it; the timetable glow [255, 176, 92]);
  the NEON BALLS every night, the plain wall + the walk-in from the side kept. DESKTOP's absinthe green was "too hard to see anything".
- **THE WINDOW PREVIEW LINKS START AT THE REVEAL** (windows.js — `L.shown` from scene.js): `&force=boss-shade`, `shades`, `bookie-slam` and
  `scene-*` hold their clocks until the city shows (they started on the first frame drawn, and a slow phone's load + reveal ate the whole
  moment); boss-shade + shades LOOP every 20 s (`FORCE_LOOP`).
- **THE BOSS's 3 AM PULL REBUILT** (window-paint.js#shadePull, core/harbor-moments.js#BOSS_PULL): a CREAM SHADE sliding down over the lit
  blue TV room (~2.8 s, eased), its bold hem bar + the shadow it throws down the glass, the TV's blue cut as the hem passes; then the set
  switches off BEHIND the drawn shade + the nightlight warms it (SHADE_LEN 7 s). NEVER a figure (SP5: "you never see the boss" — WSP had drawn
  his silhouette). The state order changed: 3:00 → 'shade' (was 'tvoff' then 'shade').
- **A PHONE HELD SIDEWAYS → TURN YOUR PHONE UPRIGHT** (index.html, inline CSS): a neon card over the city (title, lobby, games), gone the
  moment it turns back, the city running behind it; phones only — `(orientation: landscape) and (max-height: 500px) and (pointer: coarse)`;
  iPads sideways + computers keep the desktop framing. The proper sideways camera: later, with TV mode (KNOWN ISSUES).
- PROOF (WebKit 402×874 @3, every request delayed 150 ms): the boss's pull at ~2.6 s after the reveal, looping; the shades at 11:30 pm come
  down from ~5 s (at 1 am they're already down — the link uses 11:30); the bookie's throw. `C:\Users\benja\wk\wkforce.mjs` (crops one window
  every second from the reveal).

### Group 1 — THE MIGRATION (no behaviour change)
- **THE GOLDEN TABLE** first (tests/fixtures/sched-golden.mjs + .json, scripts/sched-golden.mjs): a year of 36 planners' decisions (the
  legendaries, the flyby, the Blackbird, the Mothman, the patrol, the sky events, the workers, the windows' day + night, the scenes, the boxer,
  the holidays, the tower, Christmas, the parade, the raid, the cabs, the traffic, the wildlife, the routines, the lamps, the roof modes, the
  fireworks, the breaks, the people's mix, the Halloween folk + sky) for 2 zones (Detroit, Berlin) × 2 seeds, hashed per month. Every move
  below matched it EXACTLY (tests/harbor-sched-golden.test.mjs; `--raw <system>` to look at a difference).
- **THE ROWS** (core/harbor-schedule.js — the planners read `knob(row)`, their behaviour stays in their files; the comments moved with the
  numbers): lamps, signs.modes, cabs, cabstand, traffic (+ the hour bands), dance.circle, cart, raid, xmas.prelude, parade, tower;
  wild.pigeons / gulls / owl / squirrel / coyote / cat / fireflies / heron / fish; workers (the shows' table) + workers.regulars +
  workers.faults; people.mix (the day's periods + the mood) / people.jog / door.stream / party.line / bus / roof.crowd; windows.moments /
  windows.night / windows.boss / windows.edgeshades; holidays (the calendar, Halloween's dates + hours, Thanksgiving's day, Day of the Dead's
  procession + the monarchs, the witch + the bats); legend.ghostship / ufo / tr3b / flyby / rule; sky.events (the slot + rarities);
  rosie.bell's service (FIXED) + boats.fishing; snow.work (+ the water wagon); snowman.
- **NOTHING HARD-CODES A TIME OUTSIDE THE TIMETABLE** (tests/harbor-sched-strays.test.mjs): the timed planners grepped for a timing key with a
  number, an hour compared with a number, an UPPER_CASE constant = a number — only the named non-timing numbers allowed (animation lengths,
  geometry, physics, light levels, a preview's own loop, the evening clock's wrap at noon).
- The timetable's text export prints nested knobs; pixdiff gained `--pin` (the page's Date.now frozen at its load — the clock-driven signs
  hold: the noise floor ~0.03 % at night, was ~2.2 %) + rain / snow scenes.

### Group 2 — THE scene.js SPLIT (no look change)
- Six cuts, each a pure MOVE in its own commit (a scratch tool: an acorn scope resolver moves a range of createHarbor's statements into a
  factory `createX(C)` — every reference to a binding left behind becomes `C.<name>`, a getter + a SETTER where the moved code assigns it:
  PERF-B's "needs a redesign" — the legend + holiday state stays declared in scene.js and is set through the ctx; scene.js's module helpers
  the code uses are copied; a moved `let` the rest still uses is refused): **scene-legend.js · scene-holiday.js · scene-weather.js ·
  scene-party.js · scene-perf.js · scene-panel.js**. scene.js 3807 → 2968 lines.
- **draw() QUARTERED** along its four markers: drawSky / drawCity / drawHarbor / drawWeather (F, t, dt, now) in the same closure — the 20
  locals one section hands a later one travel in ONE object F a frame (read-only across sections, checked; draw() has no early return).
- NOT done: FR5's H8 (one PT.party boolean) — a behaviour change; the frame loop + the stall + the resize stay with the frame (scene-perf
  holds only the tiering).
- PROOF per cut: pixdiff --pin at 402 (night, party, noon, golden, dusk, Halloween, fog, rain, snow, Christmas) + 390 / 430 / 1440 for the
  quartering — within the pinned noise (only the dancers on the beat clock + a few promenade movers, the same between two loads of one build);
  the touched harbor groups; THE BASELINE GUARD 3/3 after each.

### Group 3 — THE NEW SCHEDULE (behaviour changed on purpose; the golden table regenerated once)
- **THE SHOWCASE** (core/harbor-showcase.js; rows `showcase`, `showcase.prime`, `medium.*`): ONE DIAL — HIGH (now, the default) · NORMAL · LOW;
  `&showcase=` + a preview-panel row (THE SHOWCASE in LIGHTS & MUSIC; EVERYONE carries it — cleanRemote); the scene applies it each frame.
- **PRIME TIME** on the visitor's local time: 6–11 pm (Fri + Sat × 1.3), lunch 12–1 (½), late night (0.3), 2–6 am + 2–5 pm calm (0), the
  rest off-peak (⅓).
- **THE LEGENDARIES ON THEIR OWN DIAL** (`legendsTonight`): weeknights 2–3 in the prime span, party nights one an hour from 8 pm until the
  pool's four have flown, never the same one twice a night, repeats across nights, ≥ 30 min apart, never over the fireworks' minutes;
  the jaw-droppers (UFO, TR-3B) weight 1, the soft ones (the flyby, the Blackbird) 2; the TR-3B on weeknights after dark at HIGH; the
  Blackbird at lunch half the time at HIGH; Halloween night the ghost ship's; no TR-3B on the fireworks nights. A new legendary = a row with
  `knobs.pool`. legendNight / legendAt / flybyDay / soloDay / the patrol's windows / the workers' holds / the raid / the fireworks' holds all
  read every one of tonight's.
- **THE SCENES' "NO SCENE ON A LEGENDARY'S NIGHT"** → the window scenes + the shadowboxer PLAY ON through them (legendaries most nights now);
  the TR-3B's drain dims the rooms as before. The raid keeps off a legendary's MINUTES (± 5 min, it slides past one like past a show); the
  Mothman (off) + the eyes in the haze (retired) no longer skip the whole night (both sit in the small hours).
- **THE MEDIUM TIER** (`mediumDay`: a seeded thinned-Poisson process at `perHour` × primeWeight): a scheduled AIRLINER pass (air.js — on
  approach with its landing lights after dark) + an extra HELICOPTER pass at night (core/harbor-heli.js#patrolDay, ≥ 16 min clear of any
  flight); never inside a legendary's minutes. THE DOG WALK was a third kind — OFF: an extra walker on top of a full crowd broke the people's
  cap (13 at 390); the crowd keeps its own dog walkers.
- **THE 30-SECOND RULE** = something moving in view in any 30 s — proved by the day chart's sampler (quietWindows: 0 windows in 6–11 pm on a
  weeknight, a party night, a Sunday, a storm).

### Group 4 — THE BILLBOARD's HINTS
- **THE MESSAGE QUEUE** = the timetable's `billboard.*` rows (kind, two short lines, window, priority, every / show); core/harbor-billboard.js
  says what the board shows at a moment; CITY CONTROLS adds the owner's typed messages to the same queue.
- **THE HINTS**: FIREWORKS / TONIGHT 9:30 (a weeknight, 6 pm → the show); STREET PARTY / FROM 8 (Friday) + FULL SHOW / AT 10 (Saturday), from
  noon; LOOK UP / ANY MINUTE (5 min before each of tonight's legendaries — never naming it; the top priority); THE SUNDAY POSTCARD (LAST WEEK
  + a small silhouette + its name, 10 am → 6 pm). A red handbill with gold letters (signs.js#hintPoster) taking the WHOLE board for 20–25 s
  every 1–4 min inside its window, then the day's game is back (never while the billposter pastes; a neon re-layout re-applies it).
- Previews: `&force=billboard-hints&hint=fireworks|party|lookup|postcard` (a panel row: 20 s on / 10 s off) + `&force=no-hints` (TOOLS).

### Group 5 — THE DAY CHART
- **core/harbor-daychart.js** (pure): `dayChart(date, { off, level, wx })` — every item from the planners themselves (the legendaries, the
  medium tier, the patrol, the workers, the window scenes + the shadowboxer, the party + its breaks, the fireworks — the weather calls them
  off — the raid, the holidays, the billboard's hints); `yearView(year, { level })` (each rare thing per month); `quietWindows` (the 30-s rule).
- **/daychart** (daychart.html + js/daychart/page.js + daychart.js + css/daychart.css, dc-): a phone page, admins only (the /api/admin
  whoami check — the legendaries' times are a spoiler; `?preview` on localhost); the same chart as a card in **/admin**. The sample days
  (TODAY, a Tuesday, a Saturday party night, a lazy Sunday, Halloween / Thanksgiving, a stormy winter day) + any date + the dial's levels +
  THE YEAR.

## The numbers
- **THE SIM** (scripts/sim-sched.mjs — a year of the showcase per level; tests/harbor-showcase.test.mjs): a 45-s visit at a random moment of
  6–11 pm catches a legendary —
  **HIGH: 1 in 137 on a weeknight (2.5 a night), 1 in 70 on a party night (4)**; NORMAL 1 in 232 / 144 (1.6 / 2); LOW 1 in 682 / 287 (0.5 / 1).
  Never twice a night, never over the fireworks, never closer than the gap. A year at HIGH: the flyby ~299, the Blackbird ~290, the TR-3B ~242,
  the UFO ~236. THE MEDIUM TIER in prime time: HIGH 10.2 an hour (a median gap 4.6 min, p90 11.4); NORMAL 6.8; LOW 3.9.
- **THE FEASIBILITY CHECK that went to the owner** (decided "keep the counts"): 1 in 20 would need ~13 legendaries every evening from a pool of
  4 (the UFO 30 s, the TR-3B 44 s, the flyby ~5 s, the Blackbird ~6 s) with "never twice a night". The odds rise by themselves as legendaries
  join the pool.
- THE SPLIT: scene.js 3807 → 2968 lines (+ scene-legend 243, scene-holiday 108, scene-weather ~215, scene-party ~120, scene-perf ~125,
  scene-panel ~105).

## Decisions
- **The showcase's 1 in 20 vs the counts** → the owner: KEEP THE COUNTS (HIGH = 2–3 a weeknight, 4 a party night; ~1 in 137 / 1 in 70 measured).
- **The billboard's size** (~70 × 38 pt on an iPhone) → the owner: SHORT, WHOLE BOARD (two short lines, the whole board for a spell, then the game).
- **The window scenes on a legendary's night** → they play on (Claude's call, the prompt's "not during its minutes" read as "never skipped":
  a scene can't pause mid-routine; the TR-3B's drain already dims every room).
- **The medium dog walk** → off (it broke the crowd's cap); the medium tier = the planes + the helicopter passes.
- **The scene.js split** → done with a scope-checked move tool + getters / SETTERS; FR5's H8 left (a behaviour change).

## Known issues
- **A phone held sideways** shows the TURN YOUR PHONE UPRIGHT card — the proper sideways camera comes with TV mode (after the switch-over).
- **A dial change mid-evening** (the panel's EVERYONE) refreshes the legendaries + the medium tier at once, but the fireworks' memo of the
  evening keeps the night's first holds until the next evening (a preview concern only).
- **The planes stay per-device** apart from the scheduled medium passes (their lanes + paths: Math.random) — the medium pass comes at the same
  moment on every phone, its path may differ.
- The storm's close-strike check flaked once under a parallel load (35/35 alone, the same on the pre-cut build).

## The hand-off to CITY CONTROLS
- **The dial** is ONE timetable row (`showcase.level`) + `setShowcase(level)`; the panel's EVERYONE already carries `showcase` (cleanRemote):
  CITY CONTROLS gives it a proper button.
- **The message queue** = the `billboard.*` rows + core/harbor-billboard.js#hintsAt — a typed message = a row of kind 'text' (lines, window,
  priority, every / show) the same planner reads; the board's poster draws any two short lines (signs.js#hintPoster).
- **The day chart** shows the queue + the dial's effect before GO LIVE.
