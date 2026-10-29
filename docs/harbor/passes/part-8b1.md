# PART 8b1 — THE LIFE, PART 1 (Oct 25 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 8b1 — THE LIFE, PART 1 (Oct 25 2026; behind `?city=2`)

### Group 0 — the fixes from Polish 4 + the beat + the second-try sounds
- **THE SURPRISE FLYBY ~TWICE A MONTH** (`core/harbor-legend.js#flybyDay`, `FLYBY_P` 0.3 → 0.073): random days seeded by the date, golden
  hour → 23:00 as before, and NEVER on a legendary night (`legendNight` — the UFO / the TR-3B own that sky). Measured over two years: ~2.0 a month.
- **THE SIGNALS** (`road.js#signalSteps`): each pole's head faces the traffic IT controls — `face = −sg.dir` (the west pole holds the cars driving
  right: its lamps face left; the east pole the cars driving left: its lamps face right). At 402 both poles stand left of the crossing's
  middle, so POL4's "outward from the middle" turned both heads left.
- **THE WINDOW WORDS — the real limits on wordA** (19 columns, tall windows; `tests/harbor-8b1-g0.test.mjs`): one line takes 3 letters in the
  5 × 5, 4 letters in the 4 × 5, 5 letters in the 3 × 5 (5 × 3 + 4 gaps = 19 exactly; the 4 × 5 needs 24). So a 5-letter word already sets in
  the biggest font that fits — no code change; 6+ letters go to two lines / across A + B / the scroll as before.
- **A BILLBOARD SWAP SHOWS AT ONCE BY DAY** (`neon.js#billboard` → `fresh()`; `scene.js` after `layer('bill')`): the day poster is baked with
  the stage, so a swap showed only once the city's re-bake landed + crossfaded (~1–2 s, the old poster coming back during the crossfade). Now
  the new board is painted over the baked one (in the baked look's tones, a fresh text state) until a bake carrying that change has landed
  AND finished its crossfade (`revOfBake`: each bake's neon rev). The night poster was already live. The billposter (Group 1) calls the same.
- **THE VAN AT NIGHT** (`vehicles.js#nightPaint`): the cream DAIRY livery is a daytime van — after dark its slot wears one of the van's deep
  paints (forest / navy / maroon, cream lettering), which keep their colour + a lamp-lit gloss; its headlamps a size up (0.2 → 0.26).
  Only the van (the sedans' small cream / primrose bodies read fine). Preview: `tests/integration/vehicles-preview.html?s=22&only=van`.
- **THE BEAT — THE SAFETY RULE** (`core/harbor-beat.js#stepSafety`, `safePunch`, `SAFE`; `audio/beat.js#beatCal`; `scene.js#partyTick`): the
  lights PUNCH on the trusted grid only while the heard offset is CONFIRMED — the strong kicks agree (leadKick's residual) AND land within
  45 ms of where the lights put the beat. A device with a lead saved from an earlier visit may punch for 4 bars while it confirms; past that,
  or with nothing to confirm with (no trusted grid, the direct element's deaf listener, nothing heard, a settle after a return / resume /
  route change, a residual off by more), the city BREATHES — one slow raised-cosine swell a bar (≤ 0.32 × the level), no attack, never a hard
  punch that may land off the beat. Once confirmed the punch holds through a breakdown for 8 bars. The switch crossfades over ~a bar. The
  READOUT's new line under the beat line: `lights PUNCH · lead confirmed · 14 kicks` / `lights BREATHE · no kicks confirmed yet (bar 3)` /
  `lights BREATHE · settling after visible (bar 2)` / `… (→ punch 40 %)` while it crossfades; `harbor().party().safe`, `debug().safety`.
  (The beat-stepped effects — the racing laps, the marquee chase — still step on the grid; only the punch is gated.)
- **A FORCED SHOW PLAYS A PARTY SONG** (`scene.js` → `setCityClock({ show })`; `audio/mood.js#moodNow`): the panel's PARTY and every forced show
  (`&force=party / neon-party / finale / fireworks / drones / dance / strings-party / beams`, not with `no-party`) set the MUSIC MOOD to PARTY
  over AUTO — app.js#moodWatch crossfades to a party song at once; an explicit MUSIC MOOD choice (the setting / `&mood=`) still wins.
- **THE BLACKOUT'S LEFTOVERS** (the owner's add-on + a frame burst at `&force=tr3b&lgs=20`, 402×874): the lit DIAMONDS + RULE LINES beside
  SPEAKEASY (`css/title.css .nd-word::before/::after` — they now follow `--sd-logo` with the letters: dark with the sign, flickering back with
  it; a sky message dims them with the word too); the TUG's wheelhouse + cabin windows and the water TAXI's cabin windows (painted warm into
  their night sprites — dark glass like Rosie's, `boats.js`); the lighthouse cottage's lit windows IN THE WATER (the mirror copies the baked
  harbor layer — `harborBlackout` now laid on the mirror's copy too, + a hair wider on the cottage); the ROOF GUESTS still lit by the dead café
  lights + every figure's lamp light / rim (`people.js#envOf` × the power — their night tone stays); the café-light GLOBES' unlit glass (the
  daylight's pale glass + white glint read as lit bulbs at night — dark glass after dark, `strings.js`); the TREES' UPLIGHTS up the trunks (a
  narrow dark band up each trunk in the promenade's veil). KEPT LIT: the chestnut cart's stove + lantern — they are FIRE. Checked dark: the
  NEON sign + tagline, the skyline, the signs, the billboard's lamps, the wheel, Rosie, the lighthouse, the quay, the signals, WAIT / WALK,
  the street lamps, the speakeasy (the moon + its reflection stay).
- **GROK'S SECOND-TRY SOUNDS** (`scripts/add-city-sfx.py` CUTS + the new recipe steps `sat` (harmonic saturation of the band under ~160 Hz,
  its harmonics mixed back), `dup` (a high-passed duplicate layer), `seq` pieces REVERSED + equal-power crossfaded) → docs/audio.md#8b1:
  `tv-murmur` FILLED (wired already: the TV glow upstairs), `trash-truck-arrive` + `trash-truck-depart` NEW + filled (Group 1 wires them),
  `tr3b-presence` / `power-failure` / `power-restore` NEW + filled + wired, `traffic-far` still EMPTY (measured modern; its cut ready),
  `raccoon-chitter` EMPTY. THE TR-3B: its presence hum while it crosses, the power failing at 3.2 s (the lights die 3.4 → ~10 s; the old
  power-down under it at 0.55 ×), the power coming back at 37.4 s (audible ~3 s in, as the lights stutter on from 40.2 s). THE DRAIN
  DRAMATIC (`tr3bAt` music, `DRAIN_M`): the speed + pitch sag to ~0.56 × with a heavy WARBLE (a 0.55 Hz wow ± 5.5 % + a 1.9 Hz flutter ±
  2.2 %, never under 0.5 ×), the low-pass closing to 900 Hz, HELD at half volume overhead (it was ducked to 12 % — inaudible), near silent
  only under the jets (31 → 38.6 s, where the lost time is made up), then the volume back, the slow spin-up, the filter opening (sounds.js
  follows the warble ≤ ~10 steps a second).

Previews (`https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`): THE BLACKOUT `&when=2026-10-22T22:00&force=tr3b`
(`&lgs=20` held dark, `&lgs=42` coming back) · THE SIGNALS `&when=2026-10-22T22:00` · THE VAN at night `&when=2026-10-22T21:40` (or
`tests/integration/vehicles-preview.html?s=22&only=van`) · A BILLBOARD SWAP by day `&when=2026-10-22T13:00` then the console
`__district.harbor().billboard('bb-left', { game: 'gridlock' })` · THE BEAT's mode: any party night `&when=2026-10-24T22:30` (the readout's
`lights PUNCH / BREATHE` line) · A FORCED PARTY → a party song `&when=2026-10-22T22:00&force=party` · THE FLYBY `&when=2026-10-22T21:30&force=flyby`.

Tests: `tests/harbor-8b1-g0.test.mjs` (the safety rule's five cases, the van's night paint, wordA's limits); `harbor-legend.test` (the flyby
~2 a month + never on a legendary night; the drain held low, warbling); `city-sounds.test` (the new slots filled, the loop lengths).

Known issues (Group 0): `traffic-far` stays EMPTY (measured, not heard: a continuous modern-density wash — drop `traffic-far-2` from SKIP in
the importer to try its ready cut). The sounds were judged by analysis + a phone-band level check, not by ear: the reversed truck arrival,
the warble's depth and the presence hum's saturation want the owner's ears. The warble moves the media element's playbackRate ~10 × a second
— if iOS clicks on it, lower `DRAIN_M.wow / flutter` or the step rate. A 5-letter word on wordA can't be bigger than the 3 × 5 (19 columns).

### Group 1 — THE WORKERS' SCHEDULE (plan.md "THE WORKERS' SCHEDULE — DECIDED")
THE ROUTINES LAYER, grown up: a SCHEDULED set-piece layer beside the people's random visits (review-3 §A2). Three pure modules + two
drawn ones:
- **`core/harbor-workers.js` — THE TIMETABLE** (PURE): `SHOWS` (one at a time on the stage) + `REGULARS` (small; may overlap a show), each a
  row of days + a FIXED `at` (set-your-watch: the milk 5:59 so the bottles touch the step at 6:00, the newsboy 7:00, the barber 8:30, the
  beat cop 9:00 + the 9 pm `patrol`) or a seeded WINDOW for its start + a length. `workDay(key, ctx)` → the local day's workers, planned once
  from the date (every phone the same, a page opened mid-way joins mid-way): fixed shows first, then the windowed ones sliding later inside
  their window (+ `SLACK` 1 h) round the others — **NEVER TWO SHOWS AT ONCE** — or skipped that day. `forcedWork(kind, t)` = the previews
  (`&force=work-<kind>`: that worker every 3 min, the long shows on 10–36-min slots, joined mid-way). The prop states on the clock: `MILK`,
  `BUNDLES`, `WET` (the streak dries in 45 min), `PAINT_STAGES` + `paintStage(u)` (setup · out · chalk · letters · gilt · pack — a preview
  compresses them into its slot), `SHEETS` + `sheetsUp(u)` (3 × 2 sheets, the top row first), `platformAt(u, len)` (the upper floor, then a
  floor lower). CAUSE AND EFFECT, seeded by the evening's date: `bulbOut` (a marquee bulb, ~once a week), `lampFault` (a lamppost's bad night,
  ~2 a week), `boardLampOut` (a billboard gooseneck, ~every 9 days), `bootlegNight` (a few quiet weeknights a month — **THE RAID's HOOK**:
  8b2 reads it for "rarely the raid comes the night after a delivery").
- **`core/harbor-crew.js` — THE CREW** (PURE): each kind's itinerary (`PLAN[kind]`) on the people's map with a small builder over the
  people's legs — routed walks, REAL doors, `inside(dur)` (indoors between two doors: off the promenade), `climb()` (rung by rung along a
  leaning ladder: `onLadder`), the roof by its hatch (the roof's fade convention), a height on every leg (`y`: a ladder, the platform, the
  catwalk), a carried prop on every leg (`carry`). **THE TRUCKS** (`truckPlan`): they take the BUS's stop (its nose at the car's stop line
  left of the crossing — the clearest view), brake in, wait for their crew, pull away on GREEN with time to clear the crossing; the crew
  come + go round the truck's NOSE from the cab's far side (hidden by its body) and load at the BED's side, standing on the road (the kerb
  behind the truck is the bench + crabapple's corner). `crewSpan(a, b)` / `crewAt(t)` → { visits, roof, trucks, props, marks };
  `tracesAt(t)` → what outlasts a show: the milk on the step (6:00 → the barber), the bundles (→ the newsboy), the roof board's game (the
  key it shows: YESTERDAY's until the billposter's last sheet; the paste in progress), the blade's repaint (Monday: the old name until the
  painters finish), the dead bulb (`FLICK`: the repairman's test flicker), the lamp's bad night, the dead gooseneck, the can held, the
  doorman's watch, the cop's whistle.
- **`core/harbor-people.js`** — the routines layer's join: `folkAt` adds the crew's visits to the routines (kept first by the tier cap), their
  occupancy to the blocks' (the crowd plans round them, never past the cap — the window washers' platform included), and **THE CROWD GIVES
  WAY TO THE WORKERS** (`workLoad`: a block's crowd budget starts with half the workers' time on the promenade already spent — the owner's
  calmer counts hold with the milkman, the newsboy, the cop out); the trucks join the back road as LEADERS (`harbor-traffic.js`: a truck
  HOLDS the stop — no near-lane car enters from 45 s before it until it's gone) and a bus due while a truck holds the stop doesn't come
  (`busBlocked`). `folkAt().crew` = { roof, props, trucks, traces, spots, works }. New in the people's legs: `carry`, `y`, `x1/z1 + y0/y1`
  (a climb), `k: 'gap'`, `plat`.
- **`screens/harbor/folk.js` + `gear.js`** — THE WORKERS' CLOTHES (`WORKWEAR`: the white-wing sweeper all in white, the milkman's white
  jacket + cap, the cop's navy tunic + peaked cap + brass buttons + badge + baton, the mailman's grey-blue + bag, the barber's white jacket,
  the painters' white overalls, the iceman's leather apron, the billposter's apron, the bootleggers' dark caps, the lookout's long coat, the
  flower seller's shawl + basket, the musician's long coat + his DOUBLE-BASS CASE, the staff's shirt-sleeves + waistcoats; the new PEAKED cap)
  + their POSES (sweep, crank, climb, reach, paint, paste, pastehi — the long brush to the top row, squeegee, tip — the can over the bed's
  side, hold, twirl, tipHat, offer, post, lookout — his head turning) + their GEAR (`gear.js`: the wire carrier of white bottles, the bundles,
  the folding stand, the papers held up, the galvanized can on the shoulder, the ice block on its leather pad with the tongs, a crate (the
  bottle caps), buckets, the squeegee, the brushes, the ladder + the stepladder carried level, the paste bucket + the roll of sheets, the
  mailbag, the flower basket, the bass case, the white wing's can cart, the broom, the watering can, a sack, the baton twirled).
- **`screens/harbor/workers.js`** — THE PROPS as depth items in people.js's sorted passes (on the CITY clock): the tall ladder against the
  BLADE's outer edge (raised + lowered with the man), the stepladder at a lamp, the HANGING PLATFORM (davits over the parapet, the ropes,
  the plank deck + buckets behind the washers, the front rail in front of their legs), the NEWSSTAND (unfolding, papers fanned), the
  BUNDLES, the MILK BOTTLES on the step, the bootleggers' CELLAR HATCH (two steel leaves up, the amber glow below), the painters' DROP
  CLOTH, the sweeper's WET STREAK drying; and the two OVERLAYS — `drawSheets` (THE BILLPOSTER: the new poster pasted sheet by sheet over the
  old, each unrolled downward, a damp sheen fading, the seams a hair; the art = `signs.js#buildBillboard`'s `poster` + `light`, lit like the
  board: the sun's wash by day, × the gooseneck lamps' map at night) and `drawBlade` (THE SIGN PAINTERS: `bladeArt` paints a blank + the new
  board with `speakeasy-blade.js#paintBlade`; out → chalk → letters → gilt).
- **`screens/harbor/vehicles.js`** — two new kit MODELS on a `cab` body (a closed cab behind the hood + a bed): `dump` (the city's riveted
  steel dump body, its ribs + rivets, SANITATION stencilled (SP6: was CITY SANITATION)) and `stake` (the bootleggers': wooden stakes + a canvas TARP lashed over
  the hoops, a crate's corner at the tail; it runs WITHOUT LAMPS). The vans letter their trade per truck (`word`: HARBOR DAIRY, THE HERALD,
  ICE CO., SODA WATER).
- **`scene.js`** — the traces on the city: THE ROOF BOARD follows the billposter (`neon.layout({ board, boardGame, boardDead })` at a layout —
  no rebake pop at load — + `neon.billboard()` when his last sheet is up; `neon.boardPick(key)` = the layout's own pick; the board steps aside
  from the blade's game — the BLADE is the week's, never flipped by the board); THE BLADE's week turns when the Monday painters finish
  (`bladeMs`); `speak.bulb(i, k)` (the dead marquee bulb — one of the two crest bulbs at the outer edge, where the ladder leans); a lamp's bad
  night (`lampLife`: a stutter every ~40–80 s until the morning's stepladder); the real DUSK (`duskFor`: the doorman's post, the flower seller).
- **The sounds** (people.js#workSounds — through their slots, quiet): milk-bottles (set down + taken in), newspaper-rustle (the bundles, a
  sale), trash-can-lid (the lift + the tip), crates-clink, broom-sweep, squeegee, ladder-clank (up + down), police-whistle (the cop, now and
  then), the trucks (`trash-truck-arrive / -depart` for the dump truck — Group 0's takes; `truck-delivery` for the vans; the bootleggers' quiet).

**THE DAY** (a weekday; Saturday: no trash / ice / soda, the big delivery ~6:30 pm; Sunday: no milk / barber / mailman, the weekend edition):
5:30 the sweeper · 5:59 THE MILK (fixed) · ~6:35 the newspaper van · 7:00 THE NEWSBOY (fixed; weekends 8:00) · ~6:20–7:20 the trash truck ·
8:30 THE BARBER (fixed) · 9:00 THE BEAT COP (fixed) · ~9:10–9:40 a repair (the morning after a bulb / a bad lamp) · Wed ~9:20 the roof gardener ·
~9:45–10:40 the ice man · ~10:15–10:45 the mailman · Tue + Fri ~10:35 → 12:00 the WINDOW WASHERS · Mon 1:00 → 3:50 THE SIGN PAINTERS ·
~1:45–2:20 the soda water truck · ~3:55 the bartender · 4:30 → 6:30 the evening edition · ~4:50–5:20 → +34 min THE BILLPOSTER · dusk + 10 min
→ 1:50 am THE DOORMAN (party nights: until THE LINE's doorman takes over at ~8:35) · Wed–Sat dusk + 20 min → +2.4 h THE FLOWER SELLER · ~8:00
THE MUSICIAN (not Mondays) · 9:00 pm THE PATROL (fixed) · ~10:40–11:15 THE BOOTLEGGERS (a few weeknights a month) · ~1:58 am THE STAFF LOCK UP.

**HOW TO ADD A WORKER**: (1) a row in `SHOWS` / `REGULARS` (`core/harbor-workers.js`: days, `at` or `win`, `len`, `prio`, `truck`); (2) its
itinerary `PLAN[kind]` in `core/harbor-crew.js` (the builder: `edge / door / go / line / pose / climb / inside / hold / fade / fromTruck /
tail / toTruck`); (3) a look in `folk.js#WORKWEAR`, gear in `gear.js#GEAR`, a pose in `jointsOf`, props in `workers.js#propItems`; (4) a
row `work-<kind>` in `core/harbor-remote.js`'s WORKERS category (the registry test finds it); (5) a case in `tests/harbor-workers.test.mjs`.

Previews (`https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`): every worker on a loop, any day —
`&when=2026-10-22T13:00&force=work-<kind>` with kind = sweeper · milk · newsdrop · trash · newsboy · barber · cop · bulb · lamp · ice · mail ·
washers · gardener · soda · painters · sweep2 · crew · bartender · evening · billposter · doorman · flowers · musician · patrol · bootleg ·
delivery · staff (night ones look best at `T22:00`) — the panel's WORKERS rows; `&force=no-work` = everyone home. THE REAL WEEK: Monday
`&when=2026-10-26T08:31` (the barber + the newsboy), `T13:40` (the painters painting out), `T15:00` (lettering), `T17:15` (the billposter
pasting), Tuesday `&when=2026-10-27T11:20` (the window washers), `&when=2026-10-26T06:00` (the milk at night), a Saturday party night
`&when=2026-10-24T18:40` (the big delivery).

Tests (Group 1): `tests/harbor-workers.test.mjs` (the fixed times to the minute, never two shows at once over a fortnight, the weekly days,
Sunday quiet, every phone the same, the bootleggers' rarity, cause → effect, the stages, the traces — the milk until the barber, the board's
key until the billposter, the blade's week — a truck parked short of the crosswalk + away on green + no bus at the stop meanwhile, every
`&force=work-<kind>` showing someone); `harbor-people.test` (the counts with the workers out; a worker by his truck on the road; the
collector at the front-row can); e2e `G('workers')` (the milk truck + the bottles, the billposter on the catwalk pasting, the painters'
ladder + the repaint, the real Monday 8:31).

Decisions (Group 1): see the overnight list in the summary — the trucks on the back road (not the street under the dock), the billboard
keeps yesterday's poster until the billposter, the blade is the week's + the board steps aside from it, the workers count in the calmer
crowd, the awning cranked (not re-baked), the barbershop opens 8:30 Mon–Sat, the flower seller Wed–Sat, the musician not on Mondays.

Known issues (Group 1): the awning isn't re-baked by the barber's crank (it's always out — the crank is a gesture); the repairman's test
flicker shows only after dark (the marquee is unlit by day); the stepladder's lamp test flicker isn't drawn by day either; the flower
seller's sale is a gesture only (no couple stops yet); the stream guests don't stop to whisper the password to the doorman yet; the
sweeper's wet streak is a stroke along his passes (not per-cobble); `&force=work-<kind>` slots are on the clock (a page may wait up to ~3
min for a short worker to start).

### Group 2 — THE WILDLIFE (`core/harbor-wildlife.js` PURE + `tests/harbor-wildlife.test.mjs`; `screens/harbor/wildlife.js` live; `screens/harbor/fauna.js` the art; preview `tests/integration/fauna-preview.html`)
The spec: plan.md "8b — THE WILDLIFE, ALL NEW FOR CITY 2.0" + "8b — WILDLIFE THAT REACTS TO PEOPLE" + the coyote / raccoon lines + the gulls on
the billboard. Nothing of City 1.0's wildlife art is reused (the sky's own birds — geese, swifts, bats, the far gulls wheeling over the water —
stay in `birds.js`).
- **HOW IT WORKS.** Every animal's SCHEDULE is planned from a seed (the local date + a slot) like the people + the routines — a pure function of
  the clock, so every phone sees the same animal in the same place and a page opened mid-way joins it mid-way; nothing pops in or out (they
  fly / walk / climb in + out). Only the REACTIONS are live (`wildlife.js`): the people are a pure function of the clock too, so every phone
  watching sees the same scare. `frame(f)` once a frame (the plan + the reactions), then the PASSES, each where the animal really stands:
  `water` (the heron's piling + the heron, the fish — before the road layer), `far` + `near` → `items()` sorted by depth INTO the people's own
  passes (`people.js#draw`'s `env.extra`), `bill` (after the roof billboard: its top edge + catwalk), `front` (after the people: the trash can
  + the raccoon), `high` (after the café lights: the blade's top, the parapet, the date stone, the canopy's posts), `top` (after the front row
  + the leaves: the squirrel on the big maple's trunk, the fireflies). `&force=no-wildlife` takes all of it off (the speed A/B).
- **THE ART** (`fauna.js`): every animal is a handful of 3-D points in its own frame (forward / lateral / up) projected through the REAL
  camera — the bodies are ellipsoids drawn as their exact projected outline (`ellipsoid()`), so the FACING comes for free (front-on walking
  toward us, side-on crossing, 3/4 on a diagonal, the wings' undersides from behind). One light model (`litCol`): the day's sun + its side
  across each body (a lit + a shade side), the gold hour warmer, a deck flatter; at night a dark form lifted by the lamps' light where it
  stands (core/harbor-light.js#lightField) + a crisp RIM on the lamp's side (tier 0: no rim, one flat fill a body). A contact shadow under
  each, the sun's cast shadow by day. `fauna-preview.html?light=day|night|gold&scale=3&only=…` shows each at 8 headings + its poses + at the
  phone's own size (the right column).
- **THE PIGEONS** (`PIGEON`, `pigeonCount`, `groundShare`, `pigeonSlot`, `pigeonAt`, `groundLife`): the same eight birds a day, planned per
  9-minute slot — how many are out (2–8 by the hour: a full flock mornings, fewer midday, two roosting asleep at night; winter fewer, Sundays a
  few more, rain fewer) and where each sits: the cobbles (three patches on the open floor) or a LEDGE (`wildSpots`: the blade's top, the
  parapet either side of the date stone, the billboard's top + its catwalk railing, the tall lamps' crossarms, the café-light posts); the
  share on the ground falls in winter (huddled up high, rarely on the snowy cobbles), in rain (huddled on the ledges), on a busy promenade +
  in the evening. Between slots each bird flies to its new spot at its own moment in the first 70 s (never all together); some slots the
  whole flock is gone (in runs — "sometimes the whole flock is gone for a long stretch"). On the cobbles each walks + pecks + looks round
  (pure in t). THE SCATTER (live): a person walking within ~1.4–2 units flushes a bird + most of its neighbours, staggered (not always
  together) — ~70 % to a free ledge nearby for 1–4 min, ~30 % off the screen for 1.5–6 min, back from the OTHER side to a ledge if people
  are still on its patch; a scare (`scare(x, z, r)`, `startle()`) does the same. The wing-clatter (`pigeon-flutter`) at a burst, a coo now +
  then (`pigeon-coo`). The pigeons keep away from the snowy owl (no ledge within 4 units of its perch — the plan knows the owl's day).
  **A DOG CHASES THEM**: a dog walking within 2.8 units of the flock lunges at it half the time (seeded per walk) — its body stretched low,
  the front legs reaching, a bark (`dog-bark`), its owner's leash TAUT (`folk.js#drawDog`'s `lunge`, `drawLeash(…, taut)`), the flock bursts.
- **THE GULLS** (`GULL`, `gullSlot`): by day, 0–3 landings an 8-minute slot (more on windy / stormy days) on the billboard's top, its catwalk
  railing or the waterside railing either side of the WALK / WAIT lantern: a glide in from the side over the harbor, braking beats, the legs
  down, a hop on the touchdown, the wings folding; then preening, looking round, the odd call (`gulls`); a crouch + jump + hard beats away.
  Huddled (puffed, the head drawn in) in rain; none at night; a railing gull takes off early if someone comes close.
- **THE SNOWY OWL** (`OWL`, `owlDay`, `owlAt`): Dec–Mar, ~28 % of the days: glides in mid-morning to early afternoon, sits through the day on
  the billboard's corners / the date stone's top / a tall lamp's top (big, white, ~11–13 pt), a slow head turn every ~11 s, a blink, a
  silent glide to another perch every 25–60 min; at dusk the yellow eyes catch the light (a soft glow); off at dusk. NOT the lighthouse
  gallery (Decision: at z 150 it would be ~3 pt).
- **THE SQUIRREL** (`SQUIRREL`, `squirrelSlot`): on the big framing maple (the nearest, biggest tree): down the trunk in a spiral (out of the
  crown — it fades in), hops across the cobbles to 2–5 spots, sits up, the tail flicking; back up the trunk into the leaves (fading into the
  crown); in winter in + out of a HOLLOW in the trunk (a dark knot-hole, drawn in winter). Autumn the busiest (dashing to and fro), spring +
  summer often, winter rare; never in rain. Someone walking up to it → the dash back + a fast spiral climb + a chatter (`squirrel-chatter`).
  PHONE TEST: 1.5× was lost among the autumn leaves at 402 → **ENLARGED to 2× and a dark coat** (Michigan's black squirrel, common in
  Grand Rapids) with a frosted fringe on its plume — it reads by its sitting-up silhouette + the curled tail + the hops.
- **THE COYOTE** (`COYOTE`, `coyoteNight`, `coyotePath`, `coyoteTracks`): rare (~30 % of nights pass the dice; only when the people's own
  count by the clock is nearly empty): from 10 pm, likeliest 1–4 am; in from the right edge across the promenade (or the reverse from behind
  the speakeasy along the waterside sidewalk), STOPS UNDER THE LEFT TALL LAMP, turns its head to us — the green-gold EYE-FLASH in the
  lamplight — then trots on over the road + off behind the speakeasy. Someone appearing → it slinks off fast to the nearest edge. Full-moon
  nights: its own howl at the stop (the head raised, `coyote-howl`) + a distant howl later (sound only); otherwise a yip now + then.
  TRACKS IN FRESH SNOW: Part 9's hook — `frame({ snow })` > 0.3 → its prints along its path, fading over ~25 min.
- **THE RACCOON + THE TRASH CAN** (`RACCOON`, `raccoonNight`, `canAt`, `lidFixed`; the can: `core/harbor-promenade.js#CAN`, `trashCanSpot`,
  `L.trashCan`; `fauna.js#drawTrashCan`): the owner's small period GALVANIZED can with a domed lid + handles just RIGHT of the front-left globe
  lamp (by the curb + the brick street), its foot ≥ 4 pt above the dock at 390 / 402 / 430, IN FRONT of the walkable floor (no route reaches
  it), clear of the lobby line (left of that lamp). ~40 % of nights (11 pm – 3:30 am) the raccoon comes along the front walk from the left
  edge, rears up with its paws on the rim, tips the lid off (a clang, `trash-can-lid`), rummages (the head in, popping up now + then), and
  goes; the lid lies against the can until the BARBER rights it at 8:30 (or whoever empties it first — `ctx.lidFixedAt(tTip)`, Group 1's
  trash collector). It bolts if someone comes within ~3.6 units or the trash truck arrives (`frame({ truck(a, b) })`). `raccoon-chitter`
  stays EMPTY (the only file was a hiss).
- **THE SPEAKEASY CAT, OUTSIDE** (`CAT`, `catEvening`, `catPath`, `catSpot`): the window's black cat out on ~35 % of warm evenings (~12 % in
  winter), dusk → 11 pm, 6–16 min: along the facade from the left edge, a hop up onto the barbershop's outside window SILL (or the side door's
  step), sitting, the tail flicking, a lick, looking round, a meow now + then (`cat-meow`); NEVER while the window moment "THE CAT ON THE SILL"
  shows it inside (`catInside` — the same hour plan the window life builds, core/harbor-moments.js#hourPlan with its dusk / dawn). THE STALK
  (half its outings, if pigeons are on the cobbles): it drops down, creeps low toward the nearest pigeon, wiggles, POUNCES — the flock bursts —
  sits + licks a paw, walks back, hops up.
- **FIREFLIES** (`FIREFLY`, `fireflyCount`, `fireflyAt`): Jun 10 – Aug 31, 21:15 → 00:35 after dark, no rain, a light wind: up to 24 (tier
  10 / 16 / 24) drifting round the trees' feet, the bench + the compass, each its own slow glow (a soft rise, a long decay, some double).
- **THE HERON** (`HERON`, `heronMorning`; the piling: `PILING`, `pilingSpot`, `fauna.js#drawPiling`): a new weathered three-timber MOORING
  DOLPHIN out in the open water between the WALK / WAIT lantern and the right stop light (z 100 — clear of the lamps' globes + the lantern;
  Decision: the plan's "pilings" — the pier's are at z 118+, ~4 pt a heron there), painted once into a sprite. April–October on ~45 % of
  mornings the great blue heron glides in round the sunrise (slow broad beats), stands 25–70 min (a big still S-necked shape against the
  bright water, ~15 pt), strikes at the water now + then, flies off low. The old night sky crossing (birds.js) is now `&force=heron-sky`.
- **FISH JUMPING** (`FISH`, `fishSlot`): in the near water (z 66–104): a silver arc out + back in (a glint by day), the splash, three ripple
  rings spreading ~3 s; likeliest at dawn + dusk, a few by day, rare at night.
- **THE DUCK CROSSING** (`DUCKS`, `duckDay`, `duckPlan`, `ducksBlock`): spring (Apr 1 – Jun 15), ~1 day in 6, once between 7 am and 6 pm: 2–4
  adult mallards (a drake's green head + white collar + chestnut breast, the hens mottled) waddle along the waterside sidewalk from the right,
  set off across on WALK in single file, then along the curb to the right edge; a quack as they start. THE PEOPLE WAIT: `walkStart` asks
  `ctx.crossBlocked(a, b)` (core/harbor-people.js — the duck plan, pure) and nobody sets off across while the ducks are on it (the unit test
  counts the walkers it held back).
- **THE PANEL** (category WILDLIFE): PIGEONS · PIGEONS SCATTER · A DOG CHASES THEM · THE CAT OUTSIDE · THE CAT STALKS · GULLS LANDING · SNOWY
  OWL · HERON ON THE PILING · THE DUCK CROSSING · THE SQUIRREL · THE COYOTE · THE RACCOON · FIREFLIES · FISH JUMPING · NO WILDLIFE. Each preview
  LOOPS FROM THE MOMENT ITS ROW COMES ON (`since` — not from the epoch): the animal is on screen within ~2 s; the previews never bolt from
  passers-by (the coyote, the raccoon).
- **HOOKS**: `harbor().wildlife` — the debug state + `scare(x, z, r)`, `startle()` (Group 3's witnesses: the pigeons burst up, the coyote /
  raccoon / squirrel bolt), `budget(k)` (THE DIRECTOR: the share of the flock drawn), `crossBlocked(a, b)`, `canState()`; `people.positions()`
  (8b1: everyone on the promenade, the plan's — not the tier's cut); `people.draw(c, pass, { …env, extra, dogLunge })`; `frame({ canHeld(t),
  lidFixedAt(tTip), truck(a, b) })` — Group 1's trash collector carrying the can, putting the lid back, the truck scaring the raccoon.

**ADDING AN ANIMAL**: (1) its plan in `core/harbor-wildlife.js` — a function of a slot / a day + ctx → its sessions, seeded (`R(…)`), the
season / hour / weather as weights, a `force` branch; (2) its painter in `fauna.js` (3-D points through `frameOf` + `ellipsoid`, `litCol`,
`contact`, `rimOf`) + a row in `fauna-preview.html`; (3) its live state in `wildlife.js#frame` (+ a `fbase(id, period)` loop for its preview)
and its pass (`items()` for the ground, `draw(pass)` for a perch); (4) its id in `WILD_FORCES` + a row in `core/harbor-remote.js` (cat
`wildlife`); (5) a check in `tests/harbor-wildlife.test.mjs` + the panel loop of the `wildlife` E2E group.

**WHEN (for the hour-by-week planning table):** pigeons all day (2 roosting at night; the cobbles busiest early + quiet times) · gulls by day
(windy days more) · the snowy owl Dec–Mar days (~28 %) · the squirrel by day (autumn most) · the heron at sunrise Apr–Oct (~45 %) · fish
dawn + dusk most · the duck crossing Apr 1–Jun 15 (~1 day in 6, 7 am–6 pm) · the cat out dusk–11 pm (~35 %) · fireflies Jun 10–Aug 31
21:15–00:35 · the coyote 10 pm–4 am (rare, quiet nights) · the raccoon 11 pm–3:30 am (~40 %), its lid askew until 8:30.

**Tests (Group 2)**: unit `tests/harbor-wildlife.test.mjs` (14: the can above the dock at 390 / 402 / 430 + clear of the lobby line, every
perch on screen, the flock's counts + seasons + capacities + the same on every phone + joined mid-way, the owl's distance, the gulls by day,
the owl / squirrel / coyote / raccoon + lid / cat / fireflies / heron / fish / ducks' windows + rarities, the duck crossing holding the
walkers back); E2E group `wildlife` (9 checks: the flock drawn above the dock, the scatter, the coyote's eye-flash, the raccoon + the lid,
every panel row's animal by day + at night, the ducks) in its OWN cloud job `wild` (harbor-jobs.mjs + harbor.yml — the four others were
within a minute of their 5-min cap); `people` re-run green (19/19 together locally).

**Decisions (Group 2)**: the snowy owl not on the lighthouse gallery (~3 pt at z 150) — the billboard's corners, the date stone, a lamp top;
the heron on a NEW mooring piling at z 100 (the pier's pilings are too far; a nearer spot hid it behind a lamp's globe); the squirrel 2×
with a dark coat (1.5× didn't read); the trash can 1.75 units right of the globe (at 0.95 the raccoon stood hidden behind the lamp post) and no
route circle round it (it stands in front of the walkable floor); `askew` = the lid leaning on the ground against the can (the same as
`off` — no jump when the raccoon leaves); the panel's old HERON row (the night sky crossing) renamed `heron-sky`; the previews loop from the
moment their row comes on + never bolt; the whole flock (`&force=pigeons`) shows at any tier.

**Known issues (Group 2)**: the pigeons' scare reads the people's plan positions (every phone the same), but a page opened mid-scatter starts
from the plan (the live flush history isn't shared — a minute later every phone agrees again); the gull + pigeon wing poses are geometric
panels (premium at their 8–24 pt, plain in the 8× preview); the coyote's body reads a little two-humped side-on; the cat on the sill is a
black silhouette on a dark shopfront at night (its eyes + the window behind it carry it); the squirrel's spiral is a fade into / out of the
crown (no occlusion by the leaves themselves); the speed: one A/B on a loaded laptop (three agents at once) — the whole forced menagerie at
noon +1.1 ms at tier 2 (noise ±1.3) and +1.7–2.9 ms at tier 0 (noise ±2.5–5.7) → tier 0 now one flat fill a body + the piling baked;
the final A-B-B-A round decides.

### Group 3 — THE WITNESSES + THE HARBOR'S TIMETABLE
- **WITNESSES FLEE THE ABDUCTION** (plan.md, the owner Oct 25 — `core/harbor-witness.js` PURE + `tests/harbor-life.test.mjs`): a legendary night
  reshapes everyone on the promenade, planned on the clock (every phone the same, joined mid-way). `folkAt(ctx.legend = { kind, t0 })` hands
  each visit out at the moment they notice to `reactVisit`: its legs up to then kept (a walk cut where they stand), the rest replaced.
  **THE UFO**: as the saucer comes in (0 → 5.5 s) they STOP + LOOK UP, a beat apart, ~a third POINTING; when the beam opens they FLEE — a real
  RUN (folk.js: `st.run` → the jog cycle + its stride for anyone), to the nearest way out on the map (a screen edge, the side door when close,
  straight across the road from the kerb); the one nearest the bench (`hiderOf`) DUCKS BEHIND IT first, crouches 3–5 s, then bolts; a dog walker
  runs with the dog in front; the pigeons BURST UP as the beam opens (`wild.startle()`). Nobody new comes for `WITNESS.ufo.empty` (240 s) after
  the 30 s event — the promenade stays EMPTY — then the ordinary crowd drifts back in from the edges; the REGULARS (the doorman, the vendor, a
  worker) come back on their own a little after (`resume`: in from where they fled — the side door for the doorman — walking back into their
  own day's itinerary), never popping back at their posts; the reaction holds for hours on their new paths. Anyone out of reach when it
  comes (on the road, in a doorway, up a ladder) simply carries on. **THE TR-3B**: as the city goes dark (3.6 → 7.5 s) they STOP + STARE UP
  (some point); ~30 % hurry IN at the side door; when the power comes back (~41 s) the rest go on their way out of here (a quieter promenade
  for a minute); the regulars stare, then pick up their day in place. The scene hands the people the legendary's start: live
  (`legends.state()`), REMEMBERED after it ends, or a scheduled one's tail for a page opened mid-way (`legendNight` + the same weather gates as
  `legends.js#tick`) — `scene.js#legendForPeople`. Debug: `harbor().people.witness`, `.running`.
- **THE HARBOR'S TIMETABLE, through boats + light** (`core/harbor-boats.js#ROSIE_TABLE`, `FISH`, `tableAt`, `hornsBetween`; `boats.js`):
  **ROSIE** now keeps a DAY's timetable instead of a 10-minute loop: she lies at her landing between runs, casts off at **10 am, 2 pm, 6 pm**
  (out ~1 h 40; the 6 pm sunset run back by ~6:50) and at **7 pm the DINNER CRUISE**, lit up (back ~9:40), home overnight; bow-first out, astern
  in (she still never turns in sight). The far boats (the sailboats' tacks, the tug's idle) now turn + wait CLEAR of her docked hull on screen at
  390 / 402 / 430 (`clearOf` — never a tack hidden behind her). **THE FISHING TUG** (new, `L.boats` id `fish`, z 232 — a Great Lakes fish tug in
  white with a green sheer stripe on the tug's build): moored just right of the pier, out at **dawn** (6:09, 170 s across, its BOW LANTERN lit
  while it's dark), away all day, home at **4:30 pm** (its lantern again), its riding lights at night. The lighthouse lamp on at dusk was already
  the light timeline's. **THE SOUNDS** (`scene.js#harborClock` — on the city clock, never a burst after a jump): the **SHIP'S BELL** every hour
  (one ring, under the music — no dip; not at noon), the **NOON STEAM WHISTLE** off Rosie's stacks (a shaded white PLUME — a grey body, a darker
  underside + a bright crown so it reads on the cream towers — 9 s, drifting with the real wind) with THE MUSIC DIPPED (`sounds.js#ducked`: to
  0.5 over 0.6 s, held 3.5 s, eased back over 5 s), **ROSIE's HORN** as she casts off at 10 / 2 / 6, and the **7 pm DINNER CRUISE's long blast**
  (dipped the same way). Previews: `&force=ships-bell` / `steam-whistle` / `dinner-horn` (every 30 s; the panel's HARBOR → THE TIMETABLE).

Tests (Group 3): `tests/harbor-life.test.mjs` (the UFO: they look up, run, the promenade empty through the spell, people back after — three
nights; the TR-3B's stare; Rosie's day — at her landing, casting off at 10, away, backing in, the dinner cruise, home — one horn a departure;
the fishing tug's dawn + its lantern, midday away, home, moored; the far boats clear of Rosie at three sizes); e2e `workers` + THE WITNESSES
(&force=ufo on a Saturday night: running, then the promenade empty).

## PART 8b1 — THE HOUR-BY-WEEK PLANNING TABLE (what runs when — the gaps show; local time, Grand Rapids)
The WORKERS (core/harbor-workers.js — **bold** = a SHOW: one at a time), the WILDLIFE (core/harbor-wildlife.js), THE HARBOR (Rosie, the fishing
tug, the bells), THE SKY (the legendaries + the flyby + the barnstormer: core/harbor-legend.js; the everyday sky — planes, the helicopter,
balloons, birds — is the scheduler's random slots all day + night). Party nights = Fri + Sat (Part 10's show: warm-up 8:30, peak 9:30).

| local hour | Mon | Tue · Thu | Wed | Fri | Sat | Sun | every day (wildlife · harbor · sky) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0–2 | the doorman till ~1:50, staff lock up ~2 | = | = | = | (after Fri's party) the line till ~1:25, the dance till ~0:45, staff ~2 | (after Sat's party) the same | the raccoon (~40 %, 11 pm–3:30) · the coyote (rare, 10 pm–4 am) · fireflies (summer, till ~0:35) · a legendary (UFO / TR-3B, ~1–2 a month each, ≤ 0:45) |
| 2–5 | — | — | — | — | — | — | the coyote's likeliest · 2 pigeons roosting · the city asleep (**a gap: by design**) |
| 5–6 | **the sweeper ~5:30** | **the sweeper** | **the sweeper** | **the sweeper** | **the sweeper** | — | the heron at sunrise (Apr–Oct ~45 %) · the bell |
| 6–7 | **the MILK 5:59** · **the news van ~6:35** · **the trash truck** (6:20–7:20) | = | = | = | **milk** · **news van** | **news van ~7:35** | the fishing tug OUT at dawn (its lantern) · fish jumping (dawn) · pigeons (a full flock) |
| 7–8 | the NEWSBOY 7:00 → 10 | = | = | = | **the extra sweep 7:30** (after Fri) | **the extra sweep** (after Sat) | the duck crossing (spring, ~1 day in 6, 7 am–6 pm) |
| 8–9 | the BARBER 8:30 (the milk in; the raccoon's lid righted) | = | = | = | the barber · the newsboy 8 → 11 | the newsboy 8 → 11 (Sunday paper) | |
| 9–10 | the BEAT COP 9:00 · **a repair** (after a bulb / a bad lamp) | = | **the GARDENER on the roof** (~9:20 → 11) | = | **the roof CLEANUP CREW 9:00** | **the roof crew** | the squirrel (by day, autumn most) · gulls on the billboard + the railing (by day) · the snowy owl (Dec–Mar days ~28 %) |
| 10–11 | **the ICE MAN** · the mailman ~10:30 | **the WINDOW WASHERS ~10:35 → 12** · ice · mail | ice (slides after the gardener) · mail | **washers** · ice · mail | the mailman | — | ROSIE out at 10 (her horn) · the bell |
| 11–12 | | washers | | washers | | | Rosie back ~11:40 |
| 12–13 | | | | | | | **the NOON WHISTLE** off Rosie's stacks (the plume, the music dipped) |
| 13–14 | **THE SIGN PAINTERS 1:00 → 3:50** (the blade repainted) | **the SODA truck** (1:45–2:20) | soda | soda | (a busy afternoon: more strollers) | | the barnstormer (~3 days a week, 10:30–5:30 or a night run) |
| 14–15 | painters | | | | | | ROSIE out at 2 (her horn) |
| 15–16 | painters (the new name gilded) · the bartender ~3:55 | the bartender | = | = | = | = | Rosie back ~3:40 |
| 16–17 | the EVENING EDITION 4:30 → 6:30 · **the BILLPOSTER ~4:50–5:20 → +34 min** (the board's new game; a dead gooseneck fixed) | = | = | = | **the billposter** | **the billposter** | the fishing tug HOME 4:30 |
| 17–18 | (the billposter's last sheet) | | | | | | golden hour → 11 pm: the SURPRISE FLYBY (~twice a month) |
| 18–19 | | | | | **THE BIG DELIVERY ~6:30** (the bootleggers' truck) | | ROSIE's sunset run at 6 · dusk: the DOORMAN takes his post, the lamps on one by one, the cat out (~35 %, till 11) · fish at dusk |
| 19–20 | the doorman · the flower seller from Wed | the doorman | + the FLOWER SELLER (Wed–Sat) | + flowers · the party warm-up from 8:30 | + flowers · the warm-up | the doorman | THE DINNER CRUISE 7 pm (its long blast, the music dipped) |
| 20–21 | — (no musician Mondays) | the MUSICIAN ~8 pm | the musician | the musician · THE LINE from ~8:35 (+ its doorman) | the musician · THE LINE | the musician | |
| 21–22 | the 9 PM PATROL | = | = | = + the party PEAK 9:30 | = + the peak | = | Rosie home ~9:40 · fireflies (summer, from 9:15) |
| 22–23 | | | | the DANCE CIRCLE (10 → 12:45) | the dance circle | | the legendaries from 9:30 |
| 23–24 | **the BOOTLEGGERS ~11** (a few weeknights a month: the quiet truck, the cellar hatch, the lookout) | = | = | (Fri: never — the party) | — | **bootleggers** (Sun night) | the raccoon from 11 pm |

THE GAPS (deliberate or to fill): 2–5 am is asleep by design (the coyote + the raccoon own it); weekday 11 am–1 pm and 3–4:30 pm hold only
regulars + the harbor (Rosie's moves, the noon whistle) — 8b2's cabs + Part 9's weather crews (snow shovelers, leaf rakers, coal down the chute)
are the candidates; Sunday afternoon is quiet on purpose ("sleepy").

## PART 8b1 — Decisions made overnight (each the most reasonable reading; easy to reverse)
1. **plan.md had no "WITNESSES FLEE…", "THE BEAT SYNC IS STILL OFF", "THE SURPRISE FLYBY", "THE PEOPLE: CALMER" sections at the start** — the
   owner's new plan.md arrived mid-run (committed alone: "docs: plan.md — the owner's latest decisions"); built from the prompt, then checked
   against it (the flyby: 3–4 jets, set after).
2. **The workers' trucks stop on the BACK ROAD at the bus's stop** (not the street under the dock, which the dock covers most of the time): the
   clearest view; a bus due then doesn't come; no car enters the near lane while a truck holds the stop; the crew go round the truck's NOSE (the
   kerb behind it is the bench + crabapple's corner).
3. **The roof billboard keeps YESTERDAY's poster until the billposter has pasted today's** (~5–6 pm) — the board's game turns with his last
   sheet, never at 5 am; the BLADE is the WEEK's (stable from Monday's painters to the next) and the board steps aside from the blade's game.
4. **The workers count in the owner's calmer crowd**: the random crowd gives way to them (a block's budget starts with their time on the
   promenade), so the counts on screen hold.
5. **The barber cranks the awning as a gesture** (it's baked; always out); **the barbershop opens 8:30 Mon–Sat** (the window moment's OPEN at
   ~8:37); **Saturday's barber 8:30 too**.
6. **The flower seller Wed–Sat** (most weeks); **the musician every night but Monday**; **the bootleggers Sun–Thu nights only** (a few a month;
   Friday + Saturday are party nights — Saturday's big delivery is ~6:30 pm).
7. **The trash collector carries the can on his shoulder to the truck's bed** (the can hidden at its spot meanwhile); the raccoon bolts from a
   truck; the barber rights the lid the morning after (the wildlife's own `canAt`).
8. **The dead blade bulb is always a crest bulb at the outer edge** (where the ladder leans); the far signs' dead letter keeps fixing itself by
   the spell-on (no worker — too far to see).
9. **The witnesses' regulars come BACK** after the empty spell (in from where they fled) — the doorman's post isn't left empty all night.
10. **Rosie's day replaces her 10-minute loop** (the old cycle stays in the code for the tests + as the fallback with no local time); her horn
    on every departure, the dinner cruise's dipped; the far boats moved clear of her docked hull.
11. **The fishing tug reuses the tug's build** in white + green (8b2 rebuilds the boats in 3D).
12. **A fifth cloud job `wild`** (wildlife + workers) — the four were within a minute of their 5-minute cap.
13. **Group 0's beat safety rule** makes the unconfirmed paths (headless, iOS's direct element) BREATHE — the E2E music checks now ask for a
    visible swing (> 0.3), not a punch.
(Group 0's own decisions are in its section above; Group 2's in its section.)

## PART 8b1 — Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 6f65ce8 — the commit before the pass — 390×844, 4× CPU, the laptop without a GPU, 3 + 3 windows of 5 s)
| scene | tier 2: work A → B | tier 0: work A → B | verdict |
| --- | --- | --- | --- |
| a busy weekday late morning, natural (`life-noon`: Tue 11:20 — the window washers, the newsboy gone, the day's wildlife) | 8.12 → 10.91 ms (noise ±5.6), 0 → 0.3 % slow | 6.30 → 8.52 (noise ±2.3), 0 → 0 % | **same** (inside the noise) |
| the same with the whole flock + the gulls FORCED (`life-noon-forced` — the preview flags bypass the wildlife's tier cap) | 8.41 → 14.31 (±4.5) | 4.31 → 9.16 (±2.5) | slower — a preview's cost, not a real day's |
| a Saturday party night (`life-party`, 22:30 — the line, the doorman, the dance, the animals) | 35.2 → 31.5 (1 + 1 windows: the tier moved) | 14.26 → 12.78 (±2.3) | **same** |
The split (one server, `--vs`, tier 0): the workers ~0.8 ms (noise ±3.2), the forced wildlife ~3.9 ms (±6.2). A profile of the forced noon shows no
hot spot — the cost is spread over more figures drawn (folk.js + fauna.js paths). The owner's iPhone readout (`&debug=1`) decides.

## PART 8b1 — Known issues
- **THE CLOUD (2 runs, the allowed two)**: run 1 (d4b77f2 `[harbor]`): street / city / show green; two TEST-side failures — the music job's "RETURN (rAF dropped)" still asked for the old full punch (Group 0's safety rule makes that path breathe: 0.37) and the wild job's duck check sampled the moment the FIRST mallard appeared (they come in one after another) — both fixed (a swing > 0.3; wait for the row), green locally (wildlife + music 118/118). Run 2 (73ce04d): wild / show / audio green (the two fixes held); street passed 75/75 but its job failed on an emulator WebSocket console error (infrastructure — the same job was green on run 1); city: the PANEL group grabbed the WORDS IN THE WINDOWS text box before the panel drew it (a timing flake — the same code passed on run 1; untouched by the pass) — the step now waits for the box (pushed after, no third run, per the two-run rule). The quick `tests` workflow green on every push.
- **Not heard by ear**: every new sound was judged by analysis (Group 0) — the reversed truck arrival, the drain's warble, the presence hum; the
  harbor's horns + whistle are the existing takes at new moments.
- The workers: the awning isn't re-baked by the barber's crank; the repairman's / the lamp's test flicker show only after dark; the flower
  seller's sale is a gesture; the stream guests don't stop to whisper the password to the doorman yet; `&force=work-<kind>` slots run on the
  clock (a short worker may take up to ~3 min to start).
- The witnesses: a page opened DURING a forced (`&force=ufo`) flight joins the reaction from the run's start (live) — fine; a held preview
  (`&lgs=`) re-plans every ~2 s (the start drifts with the held time).
- The harbor: the noon plume is drawn on Rosie's own canvas pass (not in the water's mirror); the fishing tug's lantern isn't in the mirror either.
- (Group 0 + Group 2 known issues: in their sections.)

## PART 8b1 — Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
THE WORKERS (any day, on a loop): `&when=2026-10-22T13:00&force=work-<kind>` — milk · newsdrop · trash · newsboy · barber · cop · bulb · lamp · ice ·
mail · washers · gardener · soda · painters · sweep2 · crew · bartender · evening · billposter · doorman · flowers · musician · patrol · staff ·
`&when=2026-10-22T22:00&force=work-bootleg` (+ `work-delivery`, `work-sweeper`, `work-staff` look best in the dark). THE REAL WEEK: Monday
`&when=2026-10-26T08:31` (the barber + the newsboy) · `T13:40` (the painters painting the old name out) · `T15:00` (lettering) · `T17:15` (the
billposter pasting) · Tuesday `&when=2026-10-27T11:20` (the window washers) · `&when=2026-10-26T06:00` (the milk at night) · Saturday
`&when=2026-10-24T18:40` (the big delivery). THE WILDLIFE: Group 2's section. THE WITNESSES: `&when=2026-10-24T22:10&force=ufo` (a busy party
night — they look up, then run) · `&when=2026-10-22T21:40&force=tr3b` (they stare up). THE HARBOR: `&when=2026-10-26T09:59:30` (Rosie's horn, casting
off) · `&when=2026-10-26T11:59:40` (the noon whistle + plume) · `&when=2026-10-26T18:59:30` (the dinner cruise's blast) · `&when=2026-10-26T06:08:30`
(the fishing tug out with its lantern) · `&when=2026-10-26T16:27` (home) · the panel's HARBOR → THE TIMETABLE rows (every 30 s).

## PART 8b1 — Handoff → 8b2 (the raid + police cars, cabs, Rosie + the boats in 3D)
- **THE RAID's hook**: `core/harbor-workers.js#bootlegNight(dayKey)` (the quiet weeknight deliveries) + Saturday's `delivery`: "rarely the raid
  comes the night after a delivery" — read the previous evening's flag. The police car = a new kit MODEL (vehicles.js, a `cab` / `hard` body), its
  stop = a truck-like `truckPlan` on the back road (a `hold` leader); the witnesses' module is the model for the crowd's reaction (freeze /
  scatter); the blackout's `speak.power()` + `blackAt` for the lights; `harbor().wildlife.startle()` for the pigeons.
- **CABS**: the back road's `harbor-traffic.js` + a stop like the trucks' (`hold`), riders like the bus's (`busRiders`).
- **ROSIE + THE BOATS IN 3D**: keep `ROSIE_TABLE` / `FISH` / `tableAt` (her day) + `clearOf` (the far boats clear of her hull); the noon plume's
  anchor = her stacks (`boats.js`, a = 16.4 / 17.6, y 11.75); the fishing tug's lantern at its stem.
- **THE WORKERS** grow by rows (`SHOWS` / `REGULARS` + `PLAN[kind]`); Part 9 adds the weather crews (snow shovelers + the salt cart, leaf rakers,
  coal down the chute) — the gaps in the planning table above.
