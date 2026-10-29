# PART 8b2 — THE LIFE, PART 2 (Oct 25 2026; the raid, the cabs, Rosie + the boats in 3D, the owner's 8b1 notes; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 8b2 — THE LIFE, PART 2 (Oct 25 2026; the raid, the cabs, Rosie + the boats in 3D, the owner's 8b1 notes; behind `?city=2`)
The owner's Oct 25 notes are in plan.md ("OWNER'S NOTES — OCT 25 (after 8b1)"); two add-ons arrived mid-pass (THE RAID FROM THE FRONT,
the TR-3B BLACKOUT CHECK).

### Group 0 — the TR-3B on the phone + the drain you can hear + the 8b1 fixes
- **THE TR-3B's COST** (the owner's iPhone: 53 fps, 16 % slow at tier 2): it held the whole city at 60 fps for its 50 s — `legends.busy()`
  was "any run" — while everything in it is slow (the craft glides ~0.9 pt a frame at 30, the circuitry crawls, the dead city is still).
  Now `busy()` asks for 60 only during the F-16s' pass (~3.4 s); the rest draws at a calm night's 30. **`legends.active()`** = a legendary
  is running (the blackout, its power, its people, the director's slot) — see the fix below.
- **THE DRAIN AUDIBLE** (the AUDIO panel read NOT SOUNDING through it: 0.5 × with a ±7.7 % warble dipped to the speed iOS mutes a media
  element at, under 900 Hz at half volume): `core/harbor-legend.js#DRAIN_M` = { rate 0.6, floor 0.58, wow ±2 % (0.55 Hz), flutter ±0.7 %
  (1.9 Hz), hz 2600, held 0.72 (−3 dB), jets 0.55 } — slow, deep, wrong, clearly there; `audio/music.js#bendMusic` floors every bend at
  `BEND_FLOOR` 0.55. (WebKit not testable here — no Mac: the floor follows WebKit's documented mute below ~0.5 ×; the owner's AUDIO panel
  decides.)
- **THE BOAT WHISTLE +1 dB** (steam-whistle + ship-horn 0.16 → 0.18).
- **THE BENCH's SEATS** (`core/harbor-people.js#SEATS`, `planSeated`, `seatsOf`): three seats; a sitter's seat is RESERVED from the step
  toward it until they've stood up + walked off; a taken seat is never chosen (the other phase's sitters too); a full bench = they walk on.
- **THE DUCKS + THE RACCOON REMOVED** (their plans, art, panel rows, the duck-quack + raccoon-chitter slots + takes, tests); the trash can
  stays (the collector still carries it). City sounds: 63 slots now.

### Group 1 — THE WORKERS' QUALITY PASS (the weakest at 402 were the white uniforms at dawn — the sweeper + the milkman read as dark blobs —
and the stiff, snapping poses; the painters read best)
- **NO SNAPPING** (`folk.js#rigOf`, `BLEND` 0.34 s; `visitAt` now names each leg's `prev` / `next` + `since` / `left`): every leg eases out
  of the one before (its last frame — a walk at the same distance, a pose as it ended) — every figure, not only the workers.
- **LIFT WITH THE KNEES**: poses `pick` (down empty, up with it), `set` (down with it, up empty), `raise` (a ladder hoisted overhead as the
  prop swings up) — a squat, the back near straight, the load between the hands (`J.noCarry` hides it for the empty half).
- **RUNG BY RUNG** (`CLIMB` { rung 0.32, move 0.7 }): a climb moves one rung at a time (a step + a beat on the rung); the stepping foot
  lifts, the opposite hand reaches.
- **STROKES** (`sk(period, share)` in jointsOf): the sign painter's loaded downstroke + quick return, the billposter smoothing the sheet
  with the long brush, the washer's S (a swipe across, down a blade, back), the sweep's push (the body leaning in).
- **WEIGHT** (`core/harbor-crew.js#HEAVY`): heavy loads walk slower (ice 0.78, crates + the can 0.84, ladders 0.86 …), lean the body + weigh
  the step; a shoulder load held by the near hand (it sits behind the neck — side-on it no longer covers the face); a heavy hand load
  carried straight-armed, no swing.
- **THE LONG LADDER CARRIED BY TWO** (`LADDER.gap` 3.55; gear `ladderA` / `ladderB`): the painters in step a ladder's length apart, in and
  out; bolder rails (a dark edge + a lit top).
- **CLOTHES PER TRADE** (`WORKWEAR` + `workwear()`): the cop's tall CUSTODIAN HELMET + belt + white gloves (Decision: the owner's "helmet" —
  the period's unmistakable police silhouette at 27 pt; US beat cops wore both), the white wing's white PITH helmet, the painters' soft
  caps + lightly flecked smocks, the milkman's + the barber's bow ties, belts + buckles, aprons with their straps + ties, work gloves, the
  washers in denim bibs, a bootlegger's turned-up collar; **pale cloth stays pale at night** (the night mix eases off with luminance).
- Preview: `tests/integration/folk-preview.html?only=workers,lift,climb,strokes,carry&scale=3` (+ `&light=night`).

### Group 2 — THE RAID (`core/harbor-raid.js` PURE + `tests/harbor-raid.test.mjs`; `screens/harbor/raid.js`)
- **THE SCHEDULE** (the owner's revision): the night after a bootlegger delivery (`bootlegNight` of the night before, or Saturday's big
  one) → `RAID.after` 50 % chance of ONE raid; a party night → `RAID.party` 12 % (≈ once a month); ≈ one a week in all (measured over a
  year: 0.6–1.5 a week); prime time `RAID.window` 21:20 → 22:45; never on a holiday (`holidayOf(…).full`), a legendary night (`legendNight`)
  or across a worker's show (it slides past it inside the window, or skips the night); seeded by the date (every phone the same).
  `raidEvening(key, ctx)`, `raidNear(t, ctx)`, `forcedRaid(t, since, party)`.
- **THE CONVOY** (`raidPlan`): four patrol cars out from behind the speakeasy on the near lane (it HOLDS the lane: `raidHold` — the
  traffic waits behind), crawling past the corner; the ones rolling on are timed (≤ one signal cycle of shift) to cross on the road's
  GREEN (never through the walkers); the LAST stops at the stop line, its officer out to the kerb with his FLASHLIGHT (folk.js pose
  `flash`, gear `flashlight`), back in, away on green. ~75 s in all.
- **THE LIGHTS** (`raidAt`): the speakeasy's power cut the instant the first car shows (`speak.power`), the SHADES snapped down over every
  window, the barber pole off; after the last car is past the crossing + 4.5 s, one window flickers back, then another (`win(i)` →
  `speak.light`), the facade with the last; the club's murmur hushed + creeping back — louder on a party night (`club` × the bed).
- **THE PATROL CAR** (vehicles.js `police`): a 1929 sedan on the Model A's lines, black with WHITE DOORS, POLICE + the gold star, the
  windshield SPOTLIGHT, the roof BEACON (red, then blue, each a double flash — `raid.js#beaconOf`, `drawBeacon`).
- **THE WASH** (`raid.js#ground` / `facade`): a slow red ⇄ blue alternation (never a strobe across a big area — the owner's rule) pooled
  on the WET road round each car + the beacon mirrored in it, over the kerb, the near water + the far quay, up the speakeasy's SIDE WALL
  (`speak.sidePoly()`); tier 0: the road + the water only.
- **THE CROWD** (`core/harbor-witness.js` kind `raid`): a beat after the cars show they FREEZE watching the road (a routine always), or
  casually walk off, or look away; the DOORMAN slips in at the side door + steps back out after the lights; nobody new while it lasts.
- **THE RAID FROM THE FRONT** (the owner's add-on; `plan.front`, `frontCarAt`, `raid.js#front` + `spotPath`): one more patrol car pulls up
  on the FRONT street (under the dock) right below the speakeasy as the lights cut; its car-mounted SPOTLIGHT — a crisp beam (two clean
  edges, no haze) to a HARD CIRCLE of light — sweeps the side door, the barbershop's window, the upper windows left → right, up the blade
  and back; its red + blue from the FRONT up the speakeasy's brick + across the promenade; it leaves with the convoy. Drawn after the
  street's own pass: behind JOIN / HOST while the dock shows (its beam + circle read above them), the whole car while the dock rests. The
  back-road officer's flashlight stays as the second, smaller beam.
- **THE SOUNDS**: the far hand-crank siren as they come (+ again as they go), the 1920s police cars' engines, the officer's whistle at
  the stop (soft + distant) — through their slots.
- Previews: `&when=2026-10-22T22:00&force=raid` (one every 2½ min from the moment it's on — the panel: SPEAKEASY → THE RAID; with PARTY ON
  the club comes back louder); `&force=no-raid`; `harbor().raid` (its key, why, phase, the moments, power, cars, beam, club).
- **HOW TO TUNE IT**: `RAID` (core/harbor-raid.js) — the convoy's cars / speeds, the window + the chances, the officer's beats, the lights'
  stagger, the front car's stop (`front.screen`: its middle as a share of the screen's width).

### THE FIX — the TR-3B's blackout (the owner's add-on: forced with PARTY ON the city didn't black out)
Group 0 made `legends.busy()` mean "keep 60 fps" — but the scene also read it to switch the blackout on, so the TR-3B stopped blacking
the city out at all (party or not). `legends.active()` now drives everything a running legendary does; and **the blackout wins over the
party show**: the show is scaled by what's left of the city's power at its source (`PT.on` / `PT.ramp` × (1 − blackout k)) — the
chasers, the LED facades, the punch, the sky beams, the searchlights' turn all dark while dead, back with the power. E2E (legends): the
speakeasy's power hook dark under it; with PARTY ON the show + the sky beams off. Checked: PARTY ON + TR-3B held dark (`&lgs=20`) / flicker-out
(`&lgs=8`) / back (`&lgs=46`); TR-3B alone.

### Group 3a — THE CABS (`core/harbor-cabs.js` PURE + `tests/harbor-cabs.test.mjs`)
- At night (7:15 pm → ~1:30 am; `CAB`) the checker cab comes to the speakeasy — per people-block a seeded call (≈ ½ a block on a weeknight,
  1–2 on a party night; drops early, pick-ups late) — at the workers' truck stop (`truckPlan`: its nose at the stop line, left of the
  crossing; away only on green), kept only with the stop free (no bus, no worker's truck, no raid, no other cab); it holds the near lane.
- **DROP**: the fares step out of the kerb-side door one by one (from behind the body), round the cab's NOSE onto the kerb by the crossing
  (the kerb behind it is the bench's corner, like the trucks'), to the side door; the TAXI lamp comes on as it pulls away.
- **PICK**: a guest out of the side door to the curb, HAILS (wave) as it comes up, steps in; the lamp goes off; away on green.
- The riders count in the crowd's budget (the calmer counts hold) and react to a legendary like everyone. The ordinary traffic's cabs
  are free two times in three (vehicles.js `v.sign`).

### Group 3b — ROSIE + EVERY BOAT AS REAL 3D MODELS (`screens/harbor/boat3d.js` the kit, `boat-models.js` the models, `boats.js` rewritten; `tests/boat3d.test.mjs`)
- **THE KIT** (`boat3d.js`): a small flat-shaded mesh renderer in the Harbor's own camera (`core/harbor-layout.js#project`). A boat is
  parts in boat-local units (`a` along: 0 = stern, len = stem · `u` up from the waterline · `s` across, + = starboard); `pose(parts, V)`
  places them by world x / z + the HEADING `hd` (0 = right, π/2 = away, −π/2 = toward us) + a baked roll / pitch; back faces culled;
  faces shaded from the scene's sun side relative to a face turned to the camera (so broadside = the old sprites' colours exactly);
  batched by colour; decals (windows, stripes, rings, ROSIE) only on visible faces; parts drawn far-first with "rests on" constraints;
  Rosie's invisible `wheel` part splits her into a back + a front so her LIVE paddle wheel draws between them (behind the hull from
  ahead, in front of it from astern).
- **THE MODELS** (`boat-models.js`): ROSIE (lofted hull + boot stripe, three decks, the pilothouse, twin staggered stacks with crowns +
  a gold band, the red wheel hood + her name, the stern wheel, staffs, lifebuoys, bulb strings, lamps, sidelights), the water taxi,
  the tug + the fishing tug, the sloop (a cambered main + jib to leeward, rebuilt per pose for the trim).
- **NATURAL TURNS** (`core/harbor-boats.js`: every state has `hd` + `z`): ROSIE comes home BOW-FIRST from the right, swings round in the
  open water right of her berth (her bow toward us through head-on, 140°), and eases the last half-length astern into her landing
  bow-out — inside the same 154 s window (`ROSIE_ARRIVE`, `arriveAt`); she leaves bow-first; the fishing tug swings from its mooring
  at dawn (`FISH_TURN`). **The timetable is unchanged** (her 11:40 return window is 11:37:38 → 11:40:12; the dinner cruise's
  21:37:38 → 21:40:12).
- **ALIVE**: the wheel turns (idling at the berth), coal smoke puffs from her stacks while under way (+ the fishing tug's) drifting in
  the real wind, the noon plume from her stacks' 3D spot, lit windows at night (two halo strokes of the windows' outline), the bulb
  strings, running lights on the TRUE heading (green / red only from their side + ahead, the stern light from astern), wakes curving
  with the turn, reflections (the same sprites mirrored through `water.reflect`), the lantern at the fishing tug's stem; the blackout
  darkens the glass (`f.power`) + the lights layer (`f.lights`) — checked on main: under the TR-3B Rosie goes dark with the city.
- **THE CACHE**: each boat ONE sprite keyed by the quantized heading (½° Rosie at tier 2, ¾° tier 1, 1° tier 0 / the rest), the view
  angle (x/z in 0.012 steps), the depth (½ unit) + the look; a boat sailing straight is a blit, docked Rosie is her back + the idling
  wheel + her front composited 2.5×/s; a turn re-renders ~5.5×/s at ~3 ms (tier 2, 4× CPU — ≈ 0.6 ms a frame averaged). Memory
  0.1–0.35 MB (the old sprites ~0.5).
- **THE PART 10 HOOK — Rosie's bulbs' CHASE**: `boats.set({ chase: { rate, k, span } })` draws her bulb strings live with a bright band
  running along them; `set({ chase: null })` off (try it: `harbor().boats.set({ chase: { rate: 1, k: 1, span: 0.2 } })`).
- Previews: `&force=rosie-turn` (her turn on a 62 s loop — the panel: HARBOR → ROSIE'S TURN; it jumps back at the loop: a review flag);
  `harbor().boats.debug()` (each boat's x / y / z / hd / phase + render counts + times); `shots.mjs --crop rosie` / `boat-taxi`,
  `boat-tug`, `boat-fish`, `boat-sail`, `boat-sail2`; title-perf scenes `r-dock`, `r-dock-day`, `r-arrive`, `r-turn`, `r-turn-day`.
- **HOW TO ADD A BOAT** (Part 10's party yacht starts here):
  1. a `fooModel()` in `boat-models.js`: the hull with `loft(part, stations, bands, deckRole)`; cabins with `box` / `prismU` /
     `prismS`, stacks with `cylU`; decals with `decS` / `decA` / `archS` / `ringS` / `hull.decal` (windows `{ win: true }`); rails +
     spars with `line`; lights with `dotAt(part, p, 'side' | 'stern' | 'mast' | 'glow' | 'lantern', { n, col })`; every part
     `newPart(id, { on: '<the part it rests on>' })`; return `{ parts, c0, dots, smoke? }`;
  2. its palette (colour ROLES — `white`, `red`, `win` …, through `lit()`) in `boats.js#lookOf`;
  3. its kind → the model in `boats.js#layout`;
  4. its route in `core/harbor-boats.js#boatRoutes` (states with `x`, `z`, `hd`).
  The renderer, the cache, the reflection, the wakes + the running lights come free.

### Decisions made (each the most reasonable reading; easy to reverse)
- **The cop's tall custodian helmet** (the owner's "helmet"): the period's unmistakable police silhouette at 27 pt; the white wing a
  white pith helmet.
- **THE RAID's road**: the convoy on the NEAR lane out from behind the speakeasy; the last car stops at the stop line (its officer + the
  flashlight); the rolling cars timed to the road's green (≤ one signal cycle of shift) — never through the walkers.
- **THE RAID's schedule**: 21:20 → 22:45; 50 % after a bootlegger delivery, 12 % on a party night; never on a holiday, a legendary night
  or across a worker's show (≈ 1 a week, 0.6–1.5 over a year).
- **The front car** on the street's far lane, stopping with its middle at 19 % of the screen's width (right below the speakeasy); its
  sweep: the side door → the barbershop's window → the upper windows → up the blade → back.
- **The back-road officer's flashlight kept** as the second, smaller beam (it didn't read busy beside the spotlight).
- **The wash a slow red ⇄ blue alternation, never a strobe** across a big area (only the beacon itself double-flashes); tier 0: the road
  + the water only (the speed round).
- **The blackout wins over the party**: the party show scaled at its source by the city's remaining power (`PT.on` × (1 − k)).
- **THE CABS** at the workers' truck stop (the clearest view), only with the stop free (no bus, truck, raid or other cab); the fares walk
  round the cab's NOSE onto the kerb (the kerb behind it is the bench's corner); a party night's cab guests go straight to the side
  door; the ordinary traffic's cabs free two times in three.
- **The drain's floor 0.58 ×** (+ `BEND_FLOOR` 0.55) from WebKit's documented mute below ~0.5 × — not heard on an iPhone here (no Mac);
  the owner's AUDIO panel decides.
- **The ducks + the raccoon removed with their sounds** (63 city-sound slots); the trash can stays.
- **Heavy loads walk slower** (ice 0.78, crates 0.84, ladders 0.86 …) — a crew's itinerary stretches, its show window still holds.
- **Every figure blends out of its last pose** (not only the workers) — `BLEND` 0.34 s.
- **Rosie's astern stretch about half a length** (only ~60 pt of open water right of her berth on a phone); her turn starts ≤ 12 pt past
  the right edge and ends fully in view.
- **Rosie's twin stacks staggered abreast** (two stacks from the side like the old sprite, two head-on); her wheel fully visible under a
  hood with her name (the old box hid its top; the same total height).
- **The sloops' heel physically correct** (toward / away from the camera) — reads less than the old screen-plane lean.
- **The speed baseline** = 27e9335 (the commit before the pass), served from a worktree on :5175.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 27e9335 — the commit before the pass — 402×874, tier 2 at 2× CPU + tier 0 at 4×, the laptop without a GPU, 2 + 2 windows of 5 s)
| scene | tier / CPU | base → 8b2 (work ms a frame) | verdict |
| --- | --- | --- | --- |
| TR-3B, the city dark (`tr3b-dark`) | t2 2× / t0 4× | −1.1 / −3.5 | same / **faster** |
| TR-3B, dying (`tr3b-dying`) | t2 / t0 | same / −6.3 | same / **faster** |
| TR-3B + PARTY ON (`tr3b-party`) | t2 / t0 | −1.7 / −3.5 | same / **faster** |
| THE RAID (`raid`) | t2 / t0 | −0.9 / +2.4 (noise ±5.3; frame p95 unchanged) | same / same (after the tier-0 wash fix: it was +2.3 slower) |
| a busy harbor, Rosie in 3D by day (`h-rosie`) | t2 / t0 | −0.16 / −1.5 | same / same |
| Rosie coming home at night, mid-turn (`h-rosie-night`) | t2 / t0 | +2.0 (noise ±2.7; 0 % slow) / −0.2 | same / same |
- **THE TR-3B on the phone**: its 50 s no longer hold 60 fps — 30 fps (a calm night) except the F-16s' ~3.4 s; the laptop's busy main
  thread during it: 400–490 ms/s (the dead city) vs 550 a normal night, 700 during the jets. The owner's 53 fps / 16 % slow at tier 2
  should read as a calm night now — the iPhone's `&debug=1` decides.
- Rosie's turn: ~5.5 re-renders a second at ~3 ms (tier 2, 4× CPU) — ≈ 0.6 ms a frame averaged, single-frame spikes ~3 ms; straight
  sailing a fraction a second; docked 0 (cache).

### Known issues (8b2)
- **The drain's audibility on iOS not heard here** (WebKit can't run on this machine): the floor follows the documented mute below ~0.5 ×;
  the AUDIO panel's "sounding" on the iPhone decides — raise `DRAIN_M.floor` if it reads NOT SOUNDING.
- **THE RAID at tier 0**: +2.4 ms work inside its noise (±5.3) after the lighter wash; frame p95 unchanged.
- **The cab's fares** appear from behind the cab's body (no door animation); the cab stands half behind the crabapple at 402.
- **Far boats partly hidden**: the tug's idle / turn + the sloops' tacks happen partly behind the lighthouse + the keeper's cottage; the
  fishing tug's dawn swing behind docked Rosie (the unchanged 8b1 positions — `clearOf` keeps them clear of Rosie only).
- **Rosie's wake while turning in place is faint** (little speed; no bow wave during the turn).
- **`&force=rosie-turn` jumps** back to the swing's start each 62 s loop (a review / speed flag only).
- **The wildlife's band check** flaked once locally (passed on the rerun; untouched code).
- **The emulators can't run on this laptop** (no Java): the harbor groups ran on the title preview; Firebase's auth errors are console
  noise there.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **THE TR-3B** (30 fps now; the drain audible): `&when=2026-10-22T22:00&force=tr3b` · **with the party** `&force=tr3b,party` (the city +
  the show dark) · held dark `&lgs=20`.
- **THE RAID**: `&when=2026-10-22T22:00&force=raid` (the front car's spotlight best with the dock at rest) · a party night
  `&when=2026-10-24T22:00&force=raid` (the club comes back louder) · the panel: SPEAKEASY → THE RAID.
- **THE WORKERS**: the painters + the ladder carried by two `&when=2026-10-26T13:00` · the milkman at dawn `&when=2026-10-26T05:59` ·
  the barber + the lifts `&when=2026-10-26T08:31` · the rig up close: `tests/integration/folk-preview.html?only=workers,lift,climb,strokes,carry&scale=3`.
- **THE BENCH's SEATS**: any afternoon (`&when=2026-10-26T15:00`).
- **THE CABS**: a drop `&when=2026-10-22T20:44:40` · a pick-up (the hail) `&when=2026-10-22T21:00:50`.
- **ROSIE IN 3D**: casting off `&when=2026-10-26T09:59:50` · coming home + her turn `&when=2026-10-26T11:38:30` · the dinner cruise home
  at night `&when=2026-10-26T21:38:30` · her turn on a loop `&force=rosie-turn` (the panel: HARBOR → ROSIE'S TURN) · the bulbs' chase:
  `harbor().boats.set({ chase: { rate: 1, k: 1, span: 0.2 } })` in the console.

### Handoff → C2 / Part 9
- **Part 9 (seasons + weather)**: the workers' gaps in the planning table (snow shovelers + the salt cart, leaf rakers, coal down the chute)
  are new `SHOWS` rows + `PLAN[kind]` (the recipe in 8b1 Group 1); the raid's wash already reads `wet` (the rain's puddles brighter); the
  cabs come more often in the rain (`CAB.p` × the rain — a hook to add); the boats' models take snow on their decks + rain on the water.
- **Part 10 (party nights + fireworks)**: Rosie's bulbs' CHASE hook (see the boats above); the party yacht built as a 3D model on the
  boats' renderer from the start (HOW TO ADD A BOAT).
- **THE RAID**: Lobby 2.0 can call `forcedRaid` for a room event; the blackout's `legends.active()` / `PT.power` are the pattern for any
  future "the power's out" moment.
