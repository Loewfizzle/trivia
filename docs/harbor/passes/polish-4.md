# POLISH 4 — THE OWNER'S FP3b + 6b REVIEWS: THE SKY + THE FOREGROUND (Oct 25 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## POLISH 4 — THE OWNER'S FP3b + 6b REVIEWS: THE SKY + THE FOREGROUND (Oct 25 2026; behind `?city=2`)
Run overnight, unattended (the owner asleep): "Decisions made overnight" below. The spec: plan.md's "FP3b REVIEW NOTES" (1)–(11) + "Claude's
calls" and "6b REVIEW NOTES" (1)–(8), + the owner's add-ons sent during the night (the cars' variety, the hidden lamp + the uplights, the
TR-3B's size + circuitry + its centred orb, the surprise flyby, the drone show as a message, the window words, the traffic signals, the
billboard's posters, the people calmer). Built in three parallel worktrees (Group 1 here, Groups 2 + 3 as helpers), merged in order.
KEPT AS THEY WERE (the owner loves them): the abducted man's pose, the moon, the sun's seasonal arch.

### 1. THE TR-3B (6b note 2; `core/harbor-legend.js#blackAt`, `blackAll`, `BLACK`; `legends.js`; `scene.js` — the blackout + THE DARK CITY)
- **THE LAG, FOUND** (the owner's iPhone: 14 % slow, the tier 2→1→2): (1) every tier step REBAKES the whole city (`stepTier` → `build()`) —
  the event's first slow frames tripped a step down, the probe stepped it back up: two full rebakes mid-event. **A legendary now HOLDS the
  tier** (`perf()`: nothing judged while `legends.busy()`; the window after it starts fresh, +3 s); (2) the saucer, the beam (a per-pixel
  bake) AND the triangle were all baked on the FIRST frame the craft was drawn — now each kind's sprite is **baked ahead, in a task of its
  own** (`legends.js#warm`: a minute before a scheduled night, at once for a preview; the chase's jet sprite at ~6 s, the air show's in
  the second before it starts) — never on the frame it comes on screen. The owner's second panel run was smooth: the first was this bake.
- **THE TOTAL BLACKOUT** (the owner: keep the flicker-out as it arrives, then the WHOLE city dark while it crosses and through the jet
  flyby; back only after the jets leave, from the BACK to the FRONT, uneven + stuttering): `blackAt(s, x, depth, dir, i)` is every light's
  power, PURE (every phone the same, joined mid-way): DYING — each light at its own moment, the side the craft comes in on first (3.4 s in)
  → the far side ~5 s later, after 1.4 s of stutter (on/off flicks, the off share growing, the light sagging), the promenade a beat later;
  on top of 6b's drain sputter round the craft. DARK from ~10 s through the crossing, the gap and the chase. BACK at 40.2 s (the last
  jet's plume is off the screen at ~38.9): the FAR skyline first, its near rows +1.0 s, the NEON sign +1.8, the harbor +2.5, the
  promenade +3.4 — each light after its own dim flicks, one in four dropping out once more just after it caught. All back by ~46 s.
  What goes dark: the windows + the neon + the signs + the beacons (a DEAD depth draws none of its lights at all — cheaper than a normal
  night; neon.js `f.off` keeps its bookkeeping), the sky beams + the searchlights, the far shore's storefronts + the quay lamps, the
  wheel's bulbs + its gondolas, Rosie's windows (dark glass laid over her night sprite — `boats.js`), the lighthouse's beam + its lantern
  glass + its lit slit + the cottage's windows (`lighthouse.js#harborBlackout`), the pier's lamps, the promenade's lamps (their baked
  pools taken down), the crossing's WAIT / WALK lantern + the stop lights, the speakeasy (its ONE power hook — `speak.power()`: the rooms,
  the life, the washers, the sconces, the pole, the blade; Group 3), the café lights, the floor spots, the implied road's headlights; the
  city's glow on the low sky dims with it (`scene.js`: a dark gradient over the haze × the blackout). THE NEON SIGN + the tagline die to a
  dead tube's ghost (7 %) and stutter back after the skyline (the sign-dim hook, quantized: a steady sign never restyles the page).
- **THE DARK CITY, PRE-BAKED** (the owner: "pre-bake the dark city states"): the floodlit crowns are part of the facades' bake, so on a
  TR-3B's night the far + near skyline are baked once more with every flood OFF (`scene.js#darkStart` / `darkPump` / `darkOf`: the
  facades' own steps with `flood: 0`, in slices behind the city's bake, a minute ahead — `legends.darkWanted()`), drawn in place of the
  lit facades while a depth is dead and laid back in the drain's strips; freed when the run is over (~4–6 MB while it holds).
- **THE CRAFT** (the owner: "do NOT shrink it — he likes the size"; more textured + otherworldly): the size kept; a MATTE radar-absorbent
  skin (a baked grain + one broad soft sheen), ENGRAVED panel seams (a dark cut + a hair of light under it), the outer band's SAWTOOTH panels,
  cross seams + access hatches, the recessed corner pods, the HUB (a bevelled ring, 28 vents, the recess, the emitter's red-black lens);
  **THE CIRCUITRY** — 24 traces etched across the hull (`legends.js#circuit`: routed on the hull's own plane along 8 directions with seeded
  45° turns, out from round the hub + a family running round it, never into the hub, mapped back through the view's flattening), each a
  groove with a faint teal glow, its vias + end pads; **PULSES RACE ALONG THEM** (a bright head, a fading tail, a touch of glow; each trace
  its own speed + phase, now and then a second close behind; tier 0: one a trace, no glow); the EDGE LIGHTS (21 small lamps along the edges,
  a slow pulse running toward the nose), a ring of 12 lamps chasing round the hub, the corner orbs, the red-orange centre's heavy pulse +
  its red sheen on the belly; the rim of the city's light along the near edges fades WITH the blackout (the moon's cool hair on the far
  edge stays). **THE ORB IN THE CENTRE** (the owner): the corners about the triangle's CENTROID — the hub, the orb, the inset outlines + the
  pods all sit on it (the incenter, equidistant from the edges, was tried: it sat too far toward the wide end — the owner picked the centroid).

### 2. THE JETS (6b notes 2d + 2e + 8; `jets.js`; `core/city-sounds.js#JET_SYNC`, `jetPan`; `sounds.js#jets`; `audio/city-sound.js` sync.at)
- **A REAL F-16** (`jets.js#paintJet`, baked at 3× always — a small sprite): the ogive radome + its pitot, the gold-tinted BUBBLE canopy far
  forward with the pilot's helmet + visor in it, the CHIN INTAKE's mouth under the cockpit, the leading-edge STRAKE into the cropped delta
  (the near wing seen from just below), the tall swept FIN (its rudder line, the antenna cap, a small AMERICAN FLAG), the stabilator, the
  ventral fins, the nozzle's petals; TWO-TONE GREY CAMO (36118 on top in a wavy disruptive band + soft patches, 36270 on the sides, 36375
  under), engraved PANEL LINES + access panels; the USAF STAR-AND-BAR on the intake + under the near wing; the STORES: an AIM-9 on the
  wingtip rail, an AIM-120 on the outer pylon, a 370-gal tank on the inner one. Lit by the hour (the sun on the spine, warm at golden
  hour, a dark blue-grey with the moon's hair on its back at night). Night: the green FORMATION strips (the forward fuselage, the spine,
  the fin), the nav light on the intake (green flying right, red flying left), the white tail light, the red beacon; the Mach diamonds
  kept. The chase's jets 1.25× bigger (W × 0.2). Preview: `tests/integration/jets-preview.html` (day / golden / night, three sizes).
- **THE SOUND IN SYNC** (the owner: "it lags ~5 s", the air show's too): the 23 s take was never fetched ahead and never placed on the
  clock — it started whenever its file had loaded. Now it's FETCHED as the event starts (`cityPrefetch`) and STARTED so its roar's middle —
  4.8 s into the take (measured: the plateau 3.8 → 5.6 s in 0.2 s windows) — lands as the formation's middle crosses the screen's centre
  (`chasePeakS`, the show's `listen().peakIn`), its quiet head trimmed (2.2 s kept: it starts just before they come in), joined part-way
  with a short fade if the file came late, silent if they've already crossed; PANNED WITH THEM (`jetPan(x)` from their real place each
  tick) instead of the recording's own sweep; the music's duck round the same peak.
- **THE AIR SHOW, REDONE** (note 8: "comically bad" → no loops): `SHOW_PASSES` — THE FORMATION FLYBY: a tight DIAMOND straight across,
  smooth + fast, twice (left → right low over the crowns, then right → left just under the tagline) with the smoke on by day; THE MISSING
  MAN: a finger-four straight across, #3's heading easing up (`mmClimb`: 0 → 0.62 rad over 2.8 s, a little more later — integrated along
  its path, never a snap) and climbing away alone while the three fly on. THE SMOKE: each jet's trail is ONE continuous ribbon along its own
  past path (sampled densely every frame — sub-pixel, smooth at any frame rate), widening + thinning with age, drifting + billowing a touch,
  a wide faint body under a brighter core. Kept (it reads premium at 402: the diamond's detail + the clean trails).
- **THE SURPRISE FLYBY** (the owner's add-on, its correction: "from GOLDEN HOUR until 11 pm, weighted toward after dark, in a random
  direction"): `core/harbor-legend.js#flybyDay` — ~2.3 evenings a week (seeded by the date, every phone the same), at a seeded time from an
  hour before sunset to 23:00 (~70 % after dark), 2–4 F-16s (an echelon, four in a finger) straight across low over the crowns on FULL
  AFTERBURNER in 3.6 s, either way; weather allowing (no storm, no heavy rain, no thick fog), never over a show already flying; not a heavy
  moment for THE DIRECTOR (4 s). Its roar in sync like the others. `&force=flyby`, the panel's AIRCRAFT → SURPRISE FLYBY.

### 3. THE SAUCER (6b note 1; `legends.js#saucerSprite`, `beamSprite`, `drawUfo`)
- **MIRROR-SILVER**: the hull reads as polished chrome because each surface shows what it reflects — the upper lens the dark sky down to a
  white-hot horizon line with the neon caught at its foot (darker at the sides), the rim a dark knife edge with crisp specular lines top +
  bottom, the belly mirroring the city below (dark, the neon smeared in lathe-turned arcs, fine sheen rings, radial seams, rivets,
  brighter toward its edge). A TRANSLUCENT glass DOME on a chrome collar (the sky through it, a faint teal light inside, a fresnel edge, a
  window highlight). The reflections are baked; live: a star glint sliding along the rim, the 16 rim lights rotating with the hull, the
  dome breathing teal, the emitter's grooves + lens PULSING ORANGE from the approach (an orange underglow + its reflection on the water)
  — the beam's white OVERTAKES the orange as it opens. THE BEAM: a gaussian bright core over the soft cone, whiter down the axis, a
  stronger hot-core glow. The abducted man is untouched.

### 4. THE BARNSTORMER, PREMIUM (6b note 4; `barnstorm.js#drawBiplane`, `route`, `barnAt`)
- THE PLANE (44 logo units long, `BARN_PLANE`, ~40 pt): two fabric wings (airfoil slabs, rib tapes, the white leading-edge trim, the
  underside showing, the far wingtips offset for depth), cabane + N-struts with crossed bracing wires, a RADIAL ENGINE (five finned
  cylinder heads, exhaust stubs, a chrome cowl lip), the prop a blurred disc with two turning blades + a spinner; red with white trim
  (a cheatline, a white roundel, the white rudder's red stripes); the pilot in a leather helmet, glinting goggles + a fluttering forked
  white scarf; spoked wheels on a V undercarriage, a tail skid.
- THE ROUTE: in from the left through the first N (behind its uprights, in front of its diagonal), past the E, a full LOOP AROUND THE O
  (an ellipse round the letter, inverted over its top, never across it), then it THREADS THE LAST N (behind its left upright, across its
  diagonal in front, behind its right upright) and climbs away — constant airspeed, a touch slower over the loop's top, inside
  `BARN_LEN` (16 s). THE SMOKE by day: billowing puffs every 0.05 s on the real path on a fixed time grid (they never crawl), each
  swelling, rising + drifting on the real wind, hanging ~10 s after the plane is gone (`BARN_SMOKE`) — the ring round the O drifts off.
  The prop's sound follows `flying()` only.

### 5. THE SKY'S LOOK (6b notes 5–7)
- **THE 22° HALO** (`clouds.js#veilLook`; `core/harbor-clouds.js#haloOf`, PURE): a faint THIN ring of light — a reddish inner edge, a pale
  band, a wider fade out, the sky a touch darker inside — on ~1 veil day in 4 (seeded), drawn above the roofs. **SUN DOGS** (rarer: ~half
  of the halo days): two small rainbow-tinted spots level with the sun just outside the ring (red toward the sun, then amber, white,
  blue), a faint tail away, a gentle shimmer. (The ring is drawn at 0.42 W rather than the true 22° — at this camera both dogs then stay on
  a phone.) `&wx=veil&force=halo`, `&force=sundogs`.
- **THE AURORA's REAL COLOURS** (`aurora.js#LOOKS`): a pink / magenta fringe along its lower edge, pure green in the middle band, a touch of
  violet, deep red / crimson high up; two strand looks (redder vs more violet) crossfade slowly along the curtain over minutes (tier 0:
  one look).
- **THE DRONE SHOW = A MESSAGE** (the owner's add-on; `drones.js`, `core/harbor-sky.js#droneTimeline`, `DRONE_READ`): no staging cloud, no
  opening figure, no shapes, no closing star — the night's skytyping: the drones rise from the barge below the skyline straight into
  page 1 (matched to the pads in order: the stream fans out uncrossed, lit in the page's colour as it arrives), each page READABLE 15 s
  (calm shows 18), the next flowing in over 5 s (calm 7), then they disperse + fly home. Every holiday flies WORDS (Valentine's "HAPPY
  VALENTINES DAY", St Patrick's "SLAINTE", Easter "HAPPY EASTER", Memorial "WE REMEMBER", July 4th "HAPPY 4TH OF JULY", Halloween "HAPPY
  HALLOWEEN", Veterans "THANK YOU VETERANS", Thanksgiving "HAPPY THANKSGIVING", Christmas Eve "MERRY CHRISTMAS", NYE "HAPPY NEW YEAR" +
  "{next}"). An old `&show=` link / the API's shapes are ignored; the panel's DRONE SHOW row lost its SHAPES input. **ITS HUM HEARD**: it
  was wired but ~51.5 LUFS down under the music's duck — now +7.4 dB (still under the helicopter) → docs/audio.md.
- **SKYTYPING's DARK SOFT HALO** (`smoke.js#haloSprite`, `haloA`): a soft dark shade under every puff (drawn before them, merging into one
  shadow round the letters like the sign's), faint on open blue (0.12), firming up in front of the sun's glare (to ~0.58; the sun's place
  from the sun pass: `skyfx.sunHaze` → `smoke.draw(c, s, sun)`).
- **THE BEAMS IN FOG, VOLUMETRIC** (`fogbeam.js`; the lighthouse, the searchlights, the sky beams). WHY THEY READ FLAT: each beam was a
  polygon filled with a gradient along its axis only — the same brightness straight across (hard straight edges, no body), a linear fall
  to a cut end, the layered wedges only stepping the edges, nothing moving inside it: a sheet swinging round. NOW, as the real fog
  thickens (0.12 → 0.45), the crisp beam hands over to ONE baked body — gaussian across, dimming exponentially along its length, wider,
  faint density streaks — mapped onto any cone by an affine transform (the lighthouse's perspective fan, a searchlight's sweep, a sky
  beam), + the fog's patches lighting up as the beam sweeps through them (a drifting screen-space density field) + a big scattered glow
  at the lamp; heavy fog shorter + wider; clear air + a low deck keep the crisp beams; the searchlights read the fog alone (`mist`).
  Solved on the first attempt (nothing left for a Fable review).

### 6. THE FOREGROUND (FP3b notes 1–11 + Claude's calls + the owner's add-ons)
- **THE DOORS** (`core/harbor-people.js#DOOR`, `SIDE_STEPS`, `sideStepY`, `doorLeg`, `planVisit`'s door goal; `people.js#drawInside`;
  `speakeasy.js#flood`; `speakeasy-geo.js#DOOR_FLOOD`, `AWNING_LAMP`, `SHOP_GLOW`): the swing slower + eased (open 0.8 s, close 0.9 s) and the
  scene at 60 fps while a door swings (`fastNow` reason `'door'` — it never steps); WALKING IN: the last 1.4 units of the approach run
  straight at the door, facing it; at the side door they step up its two granite steps and go down the stair inside (`yUp`); THE DOOR
  LAMPS: both doors flooded by a live warm wash, the sconce's halo + baked landing bigger, the left awning lamp CENTRED over the barbershop
  door (u 2.6); a routing fix (`route()` steps out of a circle before routing round it, never a waypoint inside another).
- **THE DANCE CIRCLE** (`harbor-routines.js#DANCE`, `danceSpot`, `watchSpot`; `wands.js#danceMoves`, `danceStyle`; `people.js`): WHY IT READ
  OFF-BEAT: the source was already the city's beat grid — but the swing move put its extremes on the OFF-beats, and every dancer moved
  identically. Now EACH DANCER's OWN STYLE (seeded by their id: four moves from pump · swing · wave · spin · lasso · point, their own
  amplitude, bounce + mirror, a few hundredths of a beat of human timing); every accent lands ON a beat, eased curves, a phrase change
  crossfades over half a beat, the forearm follows through; one phrase in six the whole circle sways together. SPREAD OUT: four on the
  diagonals at 1.0–1.22 × the inlay's ring, two out left + right at 1.36–1.52 ×; the watchers further out at the sides; the closed floor
  a circle of 1.15 × ring + 0.4 (+ a small circle round each side spot).
- **THE CHESTNUT CART** (`props.js#bodyFront`, `roasterTop`; `people.js#roasterSmoke`): "CHESTNUTS" in 900-weight cream with a dark keyline on a
  deeper board (reads at 402); the stove's halo wider + brighter, the chimney wider + shorter, the plume thicker (16 bigger, denser puffs,
  rising higher, lighter at night) — the chimney KEPT (the glow + smoke now show).
- **THE DATE STONE** (`speakeasy-bake.js#DATE`, `paintDateStone`, `paintFrontDeco`; `strings.js#frontProfile`): the parapet rises over the
  middle bay as a brick panel flush with the wall (its own coping), the stone SET INTO it behind a fine mortar joint — no longer standing
  on the roof edge; a warm grey-buff limestone, AGED (16 grime streaks from the top edge, lichen-dark corners, spots, five chips); "EST.
  1924" INCISED — by day the cut's lower wall catches the light; at night the stone's own dim tone, washed from below by a lamp hidden on
  the cornice (the cut's upper wall catches it, the letters in shadow). KEPT. `--crop crest`.
- **THE IVY REMOVED** (`paintIvy`, `paintIvyBed` + their calls, front + side). The window box stays (on probation).
- **THE BUS** (`bus.js`): CREAM over DEEP NAVY BLUE with gold lining + lettering; its door shuts 6–9 s after the last rider
  (`harbor-people.js#BUS.shut`; FP3a's 3–5 s, the original the whole stop).
- **THE VEHICLE KIT — A VARIETY ON BOTH ROADS** (the owner's add-on, replacing "rebuild the sedan"; `vehicles.js#MODELS`, `bodySprite`,
  `wheelSprite`, `createVehicles`, `vehicleFor`, `UNDERGLOW`; preview `tests/integration/vehicles-preview.html` `?s= ?looks= ?only=`):
  a MODEL T, a MODEL A Tudor, a PACKARD (the mobster sedan — a landau bar), a ROADSTER with a rumble seat, a COUPE, a DELIVERY VAN (its
  lettering), a CHECKER CAB (the checker band + its roof lamp) — louvred hoods, brass / nickel / chrome-shield grilles, drum headlamps on
  a bar, whitewalls, side-mount or rear spares; baked per model, look + paint (deep glossy colours, chrome glints, real shading), only the
  wheels live; at night the lamps lit (a core + a tight halo; the tail lamp an ember); PARTY NIGHTS: a third of the cars carry a soft
  NEON UNDERGLOW + lit trim; NEVER THE SAME MODEL TWICE IN A ROW (each road a fixed cycle shifted by one a lap). THE STREET UNDER THE DOCK
  (`motorcar.js` now on the kit; `roadlight.js` passes the vehicle + the party): only the models whose roof stays under the dock's top
  (Packard, Model A, cab, roadster, coupe). THE BACK ROAD (`core/harbor-traffic.js`, PURE): two lanes simulated per 2-minute block + lane
  (every phone the same) — they stop at the line on red, on amber unless too close to stop (decided once, as it comes on), keep a gap
  behind each other + the bus, none spawn in the 25 s before a bus; drawn in the people's far pass (60 fps while one rolls, `'traffic'`).
- **THE HIDDEN LAMP + THE UPLIGHTS** (the owner's add-on; `harbor-light.js#HIDDEN`, `hiddenLamps` + the lamp in `lightSources` / `lampOn` /
  `treeLamps`; `trees.js#UPLIGHT.kind`): a warm lamp behind the blade sign, never drawn (its post + head behind the blade at 390 / 402 / 430,
  checked numerically), lighting the crabapple from the left + a warm accent on the bench's top, falling off to the right; the uplights
  stronger: the crabapple × 1.4 (clearly), the big maple × 1.15 (a touch).
- **THE FACADE's BLACKOUT** (`speakeasy.js#blackout`): `speak.power(0)` takes EVERY light on the building dark — the live ones × the power,
  the baked ones (the washers, the sconce's landing, the awning lamps' light, the date stone's wash) by a multiply over the building's
  outline (moonlit brick, never a black box), the window life skipped under 0.04.

### 7. THE OWNER'S OTHER ADD-ONS
- **THE WINDOW WORDS, LEGIBLE** (`core/harbor-windows.js#FONTS`, `fontsFor`, `layoutText`, `scrollColumns`; `lights.js#dimFace`, `letter`): "BUY
  BTC" read as a jumble — the 3 × 5 font too coarse, the windows not square, the face's other lit windows noise. THE WINDOWS' ASPECT,
  MEASURED: wordA + wordB's pitch is 1.75 × taller than wide, wordV's square (0.97). THREE MORE FONTS — 4 × 5 (a middle size), 5 × 5, 5 × 7
  — and each part of a message takes the BIGGEST that fits its face AND keeps a letter's natural shape through that aspect (seen aspect
  0.44 … 1.02): on A / B the 5 × 5 is the corrected 5 × 7 (it reads as ~5 : 8.8; a 5 × 7 there would be a skinny 0.4), wordV takes the
  real 5 × 7; the 3 × 5 the fallback; two words that each stand big on a tower of their own go across A + B ("BUY" 5 × 5 on A, "BTC" 4 × 5
  on B); the symbols WIDE on tall windows (a 7 × 5 heart / star). WHILE A MESSAGE SHOWS every other window on its face is an unlit pane
  (opaque — one sprite a face) and the stone sinks a little; THE LETTERS brighter, a warm white ([255, 238, 206]) with a hotter centre,
  and the stone between two lit windows of a letter glows too — each letter ONE shape, not dots. The ticker in the biggest font too.
- **THE TRAFFIC SIGNALS** (`road.js#signalSteps`, `drawSignalLamps`): ONE signal head a pole — a single red / amber / green stack facing the
  traffic that comes toward it, ONE lamp lit (two lit in all, never four); each a CRISP small lamp: a bright lens, a TIGHT halo of a few
  pt, a touch dimmer than the street lamps, NO spill across the railing + the water; after dark the faintest coloured glint on the
  ground under it.
- **THE ROOF BILLBOARD's POSTERS** (`signs.js#POSTER_PAINT`, `posterPaint` — the posters only; the day signs keep their enamel): OVERCLOCK
  read amber-on-amber under the warm lamps. No poster stands on a warm orange / amber / gold field now: OVERCLOCK cream on electric
  teal-blue (its orange icon), SLIPSTREAM gold on midnight (a cyan icon), LAST SIGNAL cream on violet-black (a red icon — its deep red read
  orange under the lamps), RUMRUNNER gold on night-harbour blue (an amber bottle — the oxblood read brown-orange); the rest checked at
  night at 402 (DOUBLE AGENT's navy + cream-gold the bar): HIGH STAKES gold on black, GRIDLOCK cream on royal blue, PRISM DROP white on
  peacock, NEON PAR cream on teal, PULSE gold on plum, CIPHER BREACH cream on bottle green. Tested: no warm field, letters ≥ 4.5 : 1.
- **THE PEOPLE, CALMER** (the owner: "a little too chaotic" — too many brisk walkers, in + out of the speakeasy; `core/harbor-people.js`,
  `people.js`, `folk.js`): THE COUNTS on screen at 402 (simulated Thu Oct 22 + Sat Oct 24; the dance circle not counted) — weekday daytime
  4–5 (~4.6–5), lunch + after work 6–7 (~6–7), a normal night 3–4 (~3.2–3.5), party nights 8–12 (~8.4–9.4, the dance circle ON TOP: it no
  longer counts against the crowd's or the tier's cap — `capByTier`, `capCrowd`, `folkAt#routineOcc`), late 0–3 (~2; a new `night` band
  0–2 am); `MIX`, `MOOD` (`partyN` 3.3, still capped at `FOLK.cap` 12); weekend days a touch busier (~5.5–7.7). LINGER MORE (`KINDS`): a new
  `bench` kind sits 2–5 min at any hour; couples stop to chat 85 % of the time (30–90 s), `meet` 40–110 s, the railing (`water`) 60–170 s,
  dog walkers 14–40 s, strollers stop 70 % for 8–24 s, stargazers point then watch 20–60 s, lone walkers watch 15–45 s; brisk walkers,
  joggers + homeward commuters down-weighted. THE SPEAKEASY STAYS SECRET: no guests in the random mix; by day only the barbershop's
  occasional customer (~3–7 an hour); THE SIDE DOOR's own schedule (`STREAM`, `streamOf`): ordinary evenings a pair in every 170–290 s
  (18:30 → 23:15), leavers every 220–380 s (21:00 → 01:45; party nights 95–165 s); THE LINE on party nights (`LINE`, `lineNight`, one pure
  simulation an evening, 20:36 → 01:24): groups of 1–3 every 55–95 s from either edge to the back of the queue where the lobby line forms
  (`linePlaces`: left of the side door along the shopfront, bending toward the corner; never longer than 7); every 70–105 s THE DOORMAN
  (a big man in a navy greatcoat + fedora — `folk.js#lookOf('doorman')`: out before the first guests, just right of the door facing the
  line, beckoning at each admission, in after the last) lets in up to 3 (whole groups), the rest step up; skipped while Lobby 2.0's own
  line is up (`ctx.lobby`) or with `&force=doors`. ARRIVALS SPREAD (`blockVisits#spaced`, `STREAM.gap`): any arrival ≥ 9 s from any other
  (a bus's riders exempt). `folkAt()` returns `line: { on, n, admits }`; one map per visit by its time (`mapAt`: the compass closed, the
  cart, the line, any mix — cached by flags). Before: ~9 on screen at noon, up to 20 visits started in one minute, 100–200 side-door
  entries an hour on a Saturday.

### Decisions made overnight (each the most reasonable reading; easy to reverse)
1. **The TR-3B's size kept** (the owner's correction mid-pass: "do NOT shrink it") — the 15 % shrink was built, then reverted; the craft got
   its circuitry + racing pulses instead.
2. **The orb on the triangle's CENTROID.** The owner asked for "the dead centre, centred from all sides": the incenter (equidistant from the
   three edges) was built and shown — it sat toward the wide end; the owner's pick was the centroid ("this is closer to center").
3. **The blackout's order:** dying from the side the craft comes in on (3.4 s → ~10 s), back from 40.2 s (after the last jet's plume is
   off the screen): far skyline → near rows (+1 s) → the NEON sign (+1.8) → the harbor (+2.5) → the promenade (+3.4). The sign is "back"
   right after the skyline (it stands over it).
4. **The NEON sign in the blackout = a dead tube's ghost (7 %)**, not invisible.
5. **The dark city is a second bake of the far + near skyline with the floods off** (~4–6 MB, only on a TR-3B's night, freed after) —
   the cheapest way to take the floodlit crowns down (they're painted into the facades).
6. **The baked light on the promenade in the blackout** (the lamps' pools, the uplights, the hidden lamp) goes by ONE multiply veil from
   the back road down (+ a little more over each tree's crown) rather than a third bake.
7. **A legendary holds the quality tier** for its ~50 s (its frames judge nothing; the window after it starts fresh).
8. **The air show KEPT** — two straight diamond flybys with smooth ribbons + the eased missing man read premium at 402 (the owner's "cut it
   if it doesn't look premium" — judged it does).
9. **THE SURPRISE FLYBY**: no spec for it had reached this session (only the owner's correction of its window) — built on the most
   reasonable reading: 2–4 F-16s straight across on afterburner, ~2.3 evenings a week, golden hour → 23:00 (~70 % after dark), either way,
   seeded by the date; not a heavy moment for THE DIRECTOR.
10. **The jets' roar placed at 4.8 s into the take** (the middle of its measured loudest plateau, 3.8 → 5.6 s) — the take's stored "peak"
    (5.5 s) sits at its end.
11. **The saucer's reflections baked** (only the glint, the rim lights, the orange / white emitter + the dome's glow live).
12. **The loop round the O** sits between the E and the last N — too little room for the whole plane: its upper wing passes in front of the
    O's right tube, its wheels just touch the last N's left upright's cut-out (judged natural, kept).
13. **The halo drawn at 0.42 W** (not the true 22°) so the sun dogs stay on a phone.
14. **Skytyping's halo is SUN-AWARE** (a constant shade turned the dots into grey smudges on open blue).
15. **The holiday drone texts** are new wording (each old show's word kept where it had one) — `SKY_HOLIDAYS`, easy to edit.
16. **The left door** = the barbershop's (the only "left" door; on upright phones it sits off the left edge) — its lamp centred, both doors
    flooded.
17. **The chimney + the date stone KEPT** (both read now); **the street under the dock leaves out the Model T + the van** (too tall for the
    dock rule — they run on the back road).
18. **The window words' 5 × 5 on wordA / B is the aspect-corrected 5 × 7** (the owner's "BUY at 5 × 7 on wordA" + "correct for the tall
    windows" together: a real 5 × 7 there reads as a skinny 0.4).
19. **The signal heads face OUTWARD** (each toward the traffic coming at it); **the poster changes are the POSTERS only** (the day signs'
    enamel unchanged).

### Removed
The air show's LOOP + its vertical pull-up (note 8); the drone show's shapes, opening figures + closing star (the panel's SHAPES input);
THE IVY; the second (far-side) lamp stack on each signal head. (`DRONE_SHAPES` / `droneShape` stay in the code, unused by the show.)

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
THE TR-3B + THE BLACKOUT `&when=2026-10-22T22:00&force=tr3b` (held: `&lgs=6` the flicker-out arriving, `&lgs=20` the total blackout +
the circuitry, `&lgs=36` the chase, `&lgs=41.5` / `&lgs=43` / `&lgs=44.5` the power coming back far → near) · THE JETS by day: THE AIR
SHOW `&when=2026-10-22T13:00&force=jets` · THE MISSING MAN `&when=2026-10-22T13:00&force=missing-man` · THE SURPRISE FLYBY at night
`&when=2026-10-22T21:30&force=flyby` (+ golden hour `&when=2026-10-22T18:15&force=flyby`) · THE UFO `&when=2026-10-22T22:00&force=ufo`
(`&lgs=4.5` the orange approach, `&lgs=14` the beam overtaking it, `&lgs=25.6` leaving) · THE BARNSTORMER `&when=2026-10-22T13:00&force=barnstormer`
(+ night `&when=2026-10-22T21:40&force=barnstormer`) · THE HALO `&when=2026-10-22T13:00&wx=veil&force=halo` · SUN DOGS
`&when=2026-10-22T13:00&wx=veil&force=sundogs` · THE AURORA `&when=2026-10-22T22:00&force=aurora` · THE DRONE MESSAGE
`&when=2026-10-22T22:00&force=drones&text=GAME%20NIGHT%20TONIGHT%209%20PM%20%7C%20SEE%20YOU%20INSIDE` · SKYTYPING in front of the sun
`&when=2026-06-21T13:45&force=skytype&text=MEET%20ME%20AT%20THE%20PIER%20AT%20NINE%20TONIGHT` · FOG: the lighthouse `&when=2026-10-22T22:00&wx=fog`,
the sky beams `&when=2026-10-24T23:00&wx=fog`, the searchlights `&when=2026-10-22T22:00&wx=fog&force=searchlights` · THE DOORS
`&when=2026-10-22T22:00&force=doors` (+ by day `&when=2026-10-22T13:00&force=doors`) · THE DANCE CIRCLE `&when=2026-10-24T22:26&force=dance` ·
THE CART `&when=2026-10-22T20:30` · THE DATE STONE `&when=2026-10-22T13:00` + `&when=2026-10-22T22:00` · THE BUS `&when=2026-10-22T11:00&force=bus` ·
THE CARS: the back road `&when=2026-10-22T11:00`, a party night's traffic `&when=2026-10-24T22:41`, the street under the dock (let the dock rest)
`&when=2026-10-22T21:40&force=road-pass` (+ by day `&when=2026-10-22T13:00&force=road-pass`) · THE HIDDEN LAMP + UPLIGHTS `&when=2026-10-22T22:00` ·
THE WINDOW WORDS `&when=2026-10-22T22:00&force=spell&text=BUY%20BTC` (+ `text=HAPPY%20NEW%20YEAR`, `text=%3C3`, `text=JOY`, `text=SPEAKEASY`) ·
THE SIGNALS `&when=2026-10-22T22:00` · THE POSTERS: tonight's poster `&when=2026-10-22T22:00` (any game: the console,
`__district.harbor().billboard('bb-left', { game: 'slip' })`) · THE PEOPLE noon `&when=2026-10-22T12:00` · lunch `&when=2026-10-22T12:30` · after work `&when=2026-10-22T18:00` · a normal night `&when=2026-10-22T21:40` · a party night + the line + the doorman + the dance `&when=2026-10-24T22:26&force=dance` · late `&when=2026-10-23T01:30`.
All the sky + the legends are in THE PREVIEW PANEL (AIRCRAFT → SURPRISE FLYBY is new; UP HIGH → SUN DOGS).

### Tests (POLISH 4)
- Unit (638): `harbor-legend.test` (THE BLACKOUT — the flicker-out from the entry side, every depth dead through the crossing + the jets,
  back far → near, stuttering, all back before the end; the chase's peak time + its last plume off the screen; THE SURPRISE FLYBY's
  frequency, window, after-dark weighting, both directions, the same for everyone); `harbor-sounds.test` (THE JETS IN SYNC: the roar's
  middle on the clock, its head trimmed, joined late only while it counts, the pan with them; THE AIR SHOW: level straight flybys, the
  missing man's eased climb); `harbor-pol4-sky.test` (the barnstormer's flight + its loop round the O + the last N, the halo + sun dogs'
  rarity, the swarm's gain, the message-only drone show); `harbor-traffic.test` (no car on the crosswalk during WALK, no overlaps incl. the
  bus, all seven models, no red-light running, never the same model twice in a row, underglow only on party nights); `harbor.test` (the
  word faces' window aspect; the posters: no warm field, letters ≥ 4.5 : 1); the bus door's 6–9 s.
- E2E (run locally on the preview, all green): `legends` (8 — the TR-3B ARRIVING: some strips flickering out; THE BLACKOUT: every depth dead
  + the dark city baked), `sky` 16, `life` 3, `speakeasy` 19, `promenade` 15, `people` 10, `windows` 16; the drone checks brought to the
  message design (3 pages = 3 shapes; "HELLO THERE" lit; the colour check at e > 22); the street car's body check accepts the kit's models.
- New tools: `tests/integration/jets-preview.html` (the F-16 close up: day / golden / night, three sizes), `vehicles-preview.html`; `shots.mjs`
  crops `crest`, `cart`, `treel`, `compass` + `--js "<expr>"` (run in the page before the shot).

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 3637716 — the commit before this pass — 402×874, the laptop without a GPU, 2 + 2 windows of 5 s)
| scene | tier 2: work A → B · slow frames | tier 0: work A → B · slow frames | verdict |
| --- | --- | --- | --- |
| THE TR-3B ARRIVING (`&force=tr3b&lgs=6`, 2× CPU) | 8.41 → 8.12 ms · 0.0 → 0.3 % | 5.22 → 5.21 · 0 → 0 % | **same** |
| THE TOTAL BLACKOUT (`&force=tr3b&lgs=20`, 2× CPU) | 8.67 → **5.83** · 0 → 0 % | 5.58 → **4.62** · 0 → 0 % | **faster** (a dead depth draws no lights) |
| A PARTY NIGHT + THE DANCE + the line + the calmer crowd (`2026-10-24T22:26&force=dance`) — first round, 2× CPU | 13.56 → 15.23 (1 + 1 windows: the laptop's tier moved) | 6.37 → 7.26 · 0 → 0 % | slower (+0.9 ms at tier 0) |
| the same after the ONE fix (tier 0: the dancers count inside the crowd's cap again, as before this pass) — tier 2 at 1×, tier 0 at 4× | 7.02 → 7.47 · (16.0 → 21.4 %: both at the laptop's frame cap) | 14.7 → 15.88 (noise ±1.55) | **same** (inside the noise) |

Also measured while building: the arrival before the pass's speed work +1.5 ms vs a normal night ("same", noise ±1.7). THE OWNER's iPhone LAG
on the TR-3B (14 % slow, 2→1→2) was the tier STEPPING mid-event (each step a full rebake) + the sprites baked on the frame the craft came on
screen — both gone (a legendary holds the tier; the sprites baked ahead) — his `&debug=1` readout on `&force=tr3b` decides. A party night's
~20 figures at tier 2 (the crowd + the circle on top): the iPhone readout on `&force=dance` decides; tier 0 keeps the circle inside its cap.

### Known issues (POLISH 4)
- **THE CLOUD (1 run of the 2 allowed)**: 7a2bbc3 `[harbor]` — all four jobs GREEN on the first run (audio 128/128, city 77/77, street 75/75,
  show 67/67); its only warnings the CI machine's absolute speed budgets (the city job's PERF lines — warnings by design). The quick `tests`
  workflow had failed from the Group 2 merge on (the server's preview-panel check still expected the drone show's `show: 'heart'`) —
  brought to the message design (32d59f6), green. Not run locally: the emulator-backed checks (no Java on this laptop) —
  every touched E2E group (legends, sky, life, speakeasy, promenade, people, windows) ran green locally on the preview.
- THE SURPRISE FLYBY was built from the owner's CORRECTION of its window alone — the original note never reached this session (Decision 9).
- THE BILLBOARD: `harbor().billboard()` swaps the NIGHT poster live; the DAY poster is baked with the stage — a game changed by day shows at
  the next rebake (as before; the day art uses the same `posterPaint`).
- THE WINDOW WORDS: a 5-letter word on wordA still sets in the 3 × 5 (24 columns at 4 × 5 > 19); longer words scroll (in the biggest font
  the rows take).
- THE SIGNALS: both poles stand left of the crosswalk's middle at 402, so both heads face left (outward from it); one head each, as asked.
- THE CARS: the cream van reads quite grey at night; the coupe's roof + visor a little heavy; the Packard's whitewall spare the brightest
  thing on it.
- THE DOORS: the door flood isn't checked against the rule that the barber pole stays the brightest light on the front (the speakeasy E2E
  group passed).
- THE PEOPLE: a bus's riders still step off together (by design); the party line doesn't react to the rain hook yet (Part 9).
- THE DRONE SHOW: the holiday window in `skyfx` still sizes itself from `night.show.length`, not the page count (only the start window).
- THE BLACKOUT on the promenade is one multiply veil (+ a darker patch over each tree's crown) over the baked night light: the cobbles'
  pools + the uplights fall to ~45 %, not to zero (a moonlit promenade).

### POLISH 4 — the owner's first iPhone look (Oct 25, ~3:40 am)
- **THE CIRCUITRY's PULSES** ("level up the visuals, or slow down considerably" — both, `legends.js` the pulses block): ~4 × slower (0.075 of the
  craft's length a second), each trace resting 3.5–9.5 s between pulses (a few at a time, never a race); each pulse LIGHTS the groove behind it
  (a long trail fading back, flat-ended segments: no beads), a hot head elongated along its run + a teal bloom, the vias it passes flash, the
  end pad flares + fades.
- **THE TAPE STOP, HEARD** (`core/harbor-legend.js#tr3bAt` music; `audio/music.js#bendMusic`, `musicCatchUp`; `sounds.js#legendSounds`): it
  worked, but the duck took the music to 11 % while it sagged (inaudible), and it snapped back in 1.5 s with an 18 s skip. Now the speed +
  pitch sag while the music is still LOUD (3.5 → 10.5 s, never under 0.5 × — iOS Safari mutes a media element below half speed), the fade to
  a hum after (8.5 → 12.5 s); after the jets the volume comes back first at the low speed (38.6 → 40.4 s), then it SPINS UP slowly (39.4 →
  45.5 s) as the filter opens; the time it lost is made up by a seek while it's still silent (38.2 s) and the small rest drains at 1.05 ×
  (the pitch kept) — never a skip. Measured live in Chrome: 0.89 × at full volume at 6.7 s, 0.67 × at full volume at 42.9 s, 1.0 by ~47 s.
- **THE LIGHTS STILL ON IN THE BLACKOUT** (his screenshot): the speakeasy's BAKED lights — the three wall-washers' lit lamp heads + their warm
  cones down the piers, the side door's sconce + its landing on the brick, the date stone's wash — laid back dark in the facade's units
  (`speakeasy.js#blackout`); the keeper's-house neon's REFLECTION in the water ("HY": the mirror drew the unscaled neon — `scene.js` lastNf);
  the pier's ticket booth window (`lighthouse.js#harborBlackout`); the crabapple's baked glow under its crown (a deeper patch).

### Handoff → 8b (THE LIFE)
- **THE VEHICLE KIT** is 8b's: a police car, the bootleggers' truck, the trash truck = new `MODELS` entries (the same numbers + flags), painted
  by `kit.draw`; add each to the road cycles (`vehicles.js`, `core/harbor-traffic.js`); sirens / special lamps go in the live block of
  `createVehicles().draw`. The back road's pure simulation (`harbor-traffic.js`) is where the raid's police cars stop.
- **THE BLACKOUT** is the raid's model: `blackAt` (any depth, PURE) + `speak.power()` + the scene's dead-depth path + the dark city bake
  (`darkWanted`) — a raid only needs its own timeline.
- **THE BACK-ROAD CARS' LAMPS** read `env.power` (the scene passes the legendary's); the street sedan's lamps follow `rf.night` (× the power).
