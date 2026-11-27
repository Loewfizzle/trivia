# THE BOOT HEADERS (moved CITY PART 2, Nov 21 2026)

The long header comments of the boot graph's modules, moved here VERBATIM so the boot carries code, not history (THE BOOT's BYTE ROOM —
docs/harbor/passes/city-part2.md "GROUP 1"). Each module keeps its header's first line + a pointer to its section here. A pass that
changes one of these modules updates its section here (and keeps the file's own header short).

## js/screens/harbor/balloons.js

```js
// CITY 2.0 — THE HARBOR, Part 6a: HOT AIR BALLOONS (docs/harbor/passes/part-6a.md; re-rendered PREMIUM in 6b). On calm, clear mornings and
// summer evenings (only when the real wind is low: core/harbor-sky.js#balloonWeather + #balloonTime) a crafted balloon drifts slowly
// across THE WHOLE SKY (6b: from under the corner buttons down to the crowns, behind the NEON sign, in front of the sun + the moon;
// nearer = bigger + lower) — rarely a FESTIVAL of several spread over it at different heights + distances.
//   6b PREMIUM     each GORE puffed between its load tapes (its own fabric shading), a soft highlight on the sun's side, the dark MOUTH
//                  you see into from below (the flame inside it on a burn), the skirt, the cables, two tiny passengers over the rim;
//                  THE BURNER's flare lights the whole envelope from inside (brightest by the mouth), the basket + the air round it
//   THE SPECIALS   (sometimes in a normal flight, always at the festival) THE TWO ₿ BALLOONS, THE OPPOSITES at every hour (PERF-A — the
//                  owner, Nov 1): 'bitcoin' all BLACK with a big ORANGE ₿ (at night still black, the ₿ glowing orange from inside) +
//                  'btc-orange' all ORANGE with a BLACK ₿ (lit orange from inside at night) — never neighbours at the festival (apartSpots);
//                  a nod, never explained · THE ALIEN HEAD — a special-shape grey
//                  alien in green, big glossy black almond eyes, seamed fabric, the basket under its chin
//   THE ENVELOPE   a teardrop of 12 gores: the stripes narrow toward its edges as they turn away (a sphere, not a flat
//                  pattern), the load tapes on the seams, the crown's vent cap, the darker skirt; shaded as a sphere toward
//                  the REAL sun's side (morning: the east, our left), a rim of sky light on the other
//   THE BASKET     wicker (a weave + a leather rim), the burner frame, the cables up to the skirt
//   THE BURNER     every 8–20 s a burn of a few pulses: a yellow-white flame up into the mouth — and at dusk the envelope LIGHTS
//                  FROM INSIDE like a lantern (its own stripes glowing, brightest by the mouth)
//   THE DISCO BALL (PERF-B — the owner, Nov 1: the festival's 7th, "make it VERY HIGH QUALITY") — a mirror-ball envelope: real TILES on
//                  the sphere (rows narrowing to the poles, the gores' meridians), each reflecting what it faces — by day the sky above +
//                  the warm city below + the sun's glints, at night the night sky + the city's neon; a handful of twinkling glints that
//                  slide with its slow turn (THE TIER TABLE's discoGlints); the burner's warm flash in the lower tiles
//   THE WHOLE SKY  (PERF-B — the owner, Nov 1: "put them HIGHER … they can go up IN FRONT OF THE NEON SIGN … drift up ABOVE it"): heights
//                  spread from just over the roofs past the sign to under the corner buttons, never a row; BY DEPTH — the far / small ones
//                  pass BEHIND the lit sign (the city's canvas), the near / big ones IN FRONT of it (a small overlay each, only while one
//                  is over the sign); the sign's band is a place they CROSS (its rows squeezed: never hovering over the letters)
// Positions are a function of the time since the event began (every phone sees the same sky): a slow drift with the real wind
// (a crossing takes most of the event), a gentle rise and fall. Sprites per balloon per light; the flame + the glow live.
```

## js/core/harbor-show.js

```js
// CITY 2.0 — THE HARBOR: THE PARTY SHOW's director + THE EVERYDAY MOTION's pick (PURE: no DOM; tests/harbor.test.mjs).
// docs/harbor/passes/neon-pass-3.md + #neon-pass-4.
//
// A party night is a CHOREOGRAPHED LIGHT SHOW across the skyline on the party beat (core/party.js's beat clock). NEON PASS 4 (the
// owner: "the neon needs to be racing around the tubes — motion, flashes, shimmer; it has to look impressive"):
//   THE HARD BEAT     every beat PUNCHES — a fast attack (~50 ms) to a clearly brighter peak, a quick decay — harder on the
//                     downbeats + the drops, rippling across the skyline (punchEnv); the tubes never go dark (≥ ~0.7)
//   RACING LIGHT      bright pulses racing round the WHOLE outline of most buildings (out.race: strength, out.dir, out.sp) — per
//                     building speed + direction, some reversing every two bars, surging on the beat (the renderer integrates)
//   FLASHES           crowns + spires flare on the strong beats (every crown on the drops), whole buildings punch on the drops,
//                     a few towers STROBE colour-to-colour on the beat (a 60 ms crossfade — never a hard on/off)
//   SCENES            colour sweeps, call-and-response, climbing ledge bands, fins in sequence, layered on the racing light —
//                     a new scene every 20–40 s; ~a quarter of the city holds (no race, no effect) in any scene
//   THE NIGHT         builds: a classy warm-up (9 pm) → the peak (11 pm) → calming after 1 am → the 2 am wind-down
//                     (harborParty: the harbor's own curve; City 1.0's core/party.js energy is unchanged)
// NEVER HEADACHE-INDUCING: no full-screen flashing, no hard on/off across large areas — the punch is brightness + glow on the
// lights themselves, with a ≥ 40 ms attack (tested).
//
//   showItems(list)  the outline items' descriptors (built once per layout): { kind: 'hero'|'word'|'mid'|'band'|'quay'|'harbor'|
//                    'far', x (0..1 across the screen), ledges, fins, crown, contour } → the director's cast
//   showFrame(cast, f, out)   one frame: f = { bar, phase (0..1 of a breath), energy, ramp, name ('warm'|'peak'|'after'), tier,
//                    motion, t (s), swell, finale, scene?, beatU (0..1 of a beat), beatT (s a beat), beatIdx (the beat in its
//                    breath: 0 = the downbeat), beats (a beat counter), rate (breaths / s) } → out (reused): { scene, a[i] (the
//                    item's tubes ×, up to ~2: the renderer draws the part over 1 additively), alt[i] (0..1 its party colour),
//                    fx[i] (0 none · 2 ledges · 3 fins · 4 crown flash), k[i], ph[i], race[i] (0..1 racing light), dir[i] (±1, fixed all night),
//                    sp[i] (speed ×), punch (the city's punch now 0..~1.6), drop, big, lights (the searchlights 0..1), beams
//                    (the sky beams 0..1), sparkle, shimmer (0..1 how often the shimmer rolls), moving, peak }
//   everyday(key, cast, signs)  tonight's calm motion: blinking / spelling signs, a colour-cycling sign, slow chasers, rotations
//                    + scheme stages through the night — seeded by the night (the same all night)
```

## js/screens/harbor/water.js

```js
// CITY 2.0 — THE HARBOR, Part 4: THE WATER (docs/harbor/passes/part-4.md#the-water). The harbor between the far quay (z 230) and the railing
// (z 64) is a real, deep body of water: a MIRROR of everything above it, in perspective, broken by ripples from the real wind.
//
//   the base (baked: waterSteps)   the water's own colour + depth — blue-green and paler where it meets the far quay by day,
//                                  orange-pink at golden hour, near-black at night so the neon pops; darker toward the viewer
//   the mirror (every frame)       the frame ABOVE the waterline, as drawn this frame (the sky, the skyline, its lit windows, the
//                                  neon, the beacons, the searchlights, the quay lamps — whatever later parts add too, and the
//                                  construction tower at whatever stage it is), copied once, flipped about the waterline
//   the light columns (night)      a bright-pass of that copy (src³: only the lights survive) smeared into vertical columns by
//                                  stretched copies — a light high on a tower reflects as a long column reaching into the near
//                                  water, a low sign as a short one by the quay; calm = short and crisp, wind = long and broken
//   the ripples                    the mirror drawn row by row (strips thin far, thick near) with a sideways wobble + a vertical
//                                  break per row (waves are wavefronts parallel to the shore: one phase per depth), the rows'
//                                  brightness flickering crest / trough — so every reflected light breaks into shimmering bands
//   the wavelets                   two baked textures of perspective dashes (sky-lit crests, dark troughs) sliding against each
//                                  other; their density follows the wind
//   the paths                      the SUN's gold glitter path toward us when it is low (golden hour / dawn), the MOON's silver
//                                  one at night (its real place + phase; none when down or behind real cloud), sun glints by day
//   the near edge                  the water lapping at the foot of the near quay wall, behind the railing
//
// Cost: the work is split over frames — one BUILDS the mirror, the next COMPOSES the water (tier 2: 30 water frames a second;
// tier 1: 20, wider strips, fewer copies); tier 0 and reduced motion = a calm baked mirror, re-drawn about once a second with the
// ripples still (the lights still follow the city). HOOKS for later parts (docs/harbor.md
// "stubs"): reflect(fn, axisY) — an object standing in the water drawn flipped about its own waterline (the wheel + the
// lighthouse use it now; Part 5's boats, Rosie, the train, the beam) · light(x, y, col, a, w) — a light that is not in the frame
// above the waterline (fireworks high in the sky, Part 10; the ghost ship's glow, 11a) as a column in the water · set({ rain, fog }) — the weather (rain roughens the mirror; the fog over the water is waterfog.js, 9a; the rain's rings: ATM).
```

## js/screens/harbor/wheel.js

```js
// CITY 2.0 — THE HARBOR, Part 5: THE FERRIS WHEEL (docs/harbor/passes/part-5.md). A real steel wheel on its pier, turning slowly on
// the real clock (one turn in 150 s — every phone shows it at the same angle):
//
//   the steel (a sprite, rotated)   the rim (two rings + the zigzag truss between them), 16 pairs of tension spokes crossing
//                                   to the hub, an inner ring, the hub's plate + bolts — painted red steel by day, a dark
//                                   silhouette at night; the sun's side of the rim catches the light (drawn per frame: it must
//                                   not turn with the wheel)
//   the gondolas (16 sprites)        cabins that HANG LEVEL from their pivots on the rim and sway a little; painted by day,
//                                   their windows lit warm at night (a few empty and dark)
//   the bulbs (night; sprites)       48 on the rim (three chase sets), 64 on the spokes (four rings), a star round the hub:
//                                   PATTERNS on a 48 s show — steady, a chase round the rim, rings pulsing outward, a sparkle;
//                                   their colours from a SCHEME (city warm white; halloween, christmas, valentine, stpatrick,
//                                   july4, nye, party — the hooks for Parts 10 + 11a–c: harbor().wheel.scheme(name))
//   the A-frames                     the back one baked with the pier (pier.js#aFrame), the front one a sprite over the wheel
//   the light                        at night a warm haze round the wheel + its pool on the platform's deck
//   the reflection                   reflect(ctx): the same wheel, flipped by the water (water.reflect, the mirror's 10 a second)
//
// Tier 0 + reduced motion: the bulbs steady (no show); reduced motion also stills the wheel (it stands at its angle).
//
// NEON PASS 5 — THE WHEEL AS A SHOWPIECE (the owner: with the dark offices behind it, it can stand out much more): bigger,
// brighter bulbs, a wider soft halo round the rim, warm-lit gondolas, and its bulbs drawn ONE BY ONE into the 20-a-second cache
// (a colour + a level each — ~170 small draws 20 times a second, never per frame):
//   A NORMAL NIGHT   elegant + slow — a gentle colour wave travelling round the rim (gold, rose, ice in turn, ~14 s a lap), a
//                    slow sparkle, and every ~40 s a spiral running out from the hub along the spokes
//   A PARTY NIGHT    a light show on the beat in the party palette (core/harbor-show.js#PARTY_PAL, the city's colour scene),
//                    a new routine every 4 bars — a rainbow chase round the rim, the spokes lighting in sequence like a clock
//                    hand, spirals, bursts from the hub on the strong beats (and a big one on the drops); the whole wheel
//                    punching with the city. Smooth envelopes everywhere: one of the party's stars, never a strobe.
```

## js/screens/harbor/sounds.js

```js
// CITY 2.0 — THE HARBOR's CITY SOUNDS (Part 8a; docs/audio.md#the-city-sounds): what in the city calls which slot. The scene
// ticks it every frame (it looks ~4× a second); every event that exists today calls its slot, and an EMPTY slot is silent (the
// player does nothing), so a recording dropped in later just starts sounding with its event.
//   THE BED      city-hum-day / city-hum-night crossfading (equal power) on the city's ONE darkness (core/harbor-dark.js: the
//                blue hour — the same input every light reads) LEAD it · water-lapping always, far + soft under the hum (FP).
//                FP: ducked while the music is on (core/city-sounds.js#bedMix); with the music on it waits for the song to sound
//                and fades in slowly — it never starts louder than the music
//   THE SKY      (Oct 24: filled — the owner's recordings.) The aircraft are FLYBYS, chained while their thing is up (run(): each
//                take its own swell, the next one starting as the last fades — never a seam): helicopter (its two flybys, panned
//                with it, louder while it hovers) · airliner-far (the loudest plane crossing: its flyby from the start of the
//                crossing, panned, swelling with it) · prop-plane (the banner plane, the skywriters) · geese (one flyover a V,
//                panned with it) · drone-swarm (a bed: the drone show) · balloon-burner (a burn every ~6–18 s while balloons are
//                up, far + low-passed). All of it WELL UNDER the bed and ducked with it under the music (bedMix's k)
//   THE HARBOR   gulls (by day while gulls fly: mostly one call, now and then two or three in a row, random gaps of ~14–66 s,
//                fewer when there are fewer — core/city-sounds.js#gullCalls / gullGap) · boat-putter (the water taxi
//                crossing) · foghorn (the lighthouse, in real fog: every ~40–80 s)
//   THE API      play(slot, o) / loop(slot, o) — the road's cars (Part 8: play('car-1920s-pass', { pan, gain }) → its handle's
//                `peak` = s after the start when the car is nearest), anything later
//   8P           THE SPEAKEASY's LIFE heard (speakeasy(b) with b.fr = the windows' frame): each moment's cues on the clock
//                (core/city-sounds.js#MOMENT_CUES — the toast's clink, the wake's blind + sash, the cat landing, the bar through
//                the open mirror door + its thud shut, the barbershop's opening), the barbershop's day (the bell in + out, snips
//                while he cuts), the 3 am broom · THE BUS (bus(event, o)) · THE PEOPLE (step / laugh / cart / cartBell / line /
//                rooftop) · THE JETS (jets(o): panned right → left, the music ducked round their peak — the slot's `duck`)
// City 2.0's title only (the scene lives there); the Effects slider + Mute rule it (the SFX bus); all of it fails silently.
```

## js/screens/harbor/birds.js

```js
// CITY 2.0 — THE HARBOR, Part 6a: THE BIRDS (docs/harbor/passes/part-6a.md). Who is up comes from core/harbor-sky.js#birdsNow (the
// hour, the month, the weather); every bird is a crafted silhouette drawn live (a few paths each — no sprite to tint), lit by
// the hour: by day the gulls' white undersides against the city, at dusk dark shapes against the glowing sky.
//   GULLS   harbor(c)  a few wheeling over the water in front of the skyline by day — long glides on bent "M" wings (white
//                      body + underwings, grey mantle when they bank, black tips), a few lazy wingbeats to climb; nearer ones
//                      bigger. Drawn before the water: the mirror reflects them.
//   SWIFTS  low(c)     a screaming party darting round the rooftops on summer evenings (scythe wings, fast flicker)
//   BATS    low(c)     summer dusk into the night: smooth looping paths with quick darts (a fast but smooth swerve ~once a
//                      (11a-1: THE HALLOWEEN COLONY — s.hween: at dusk on Halloween night a stream of bats POURING out of a tower
//                      crown (core/harbor-ghost.js#colonyBat: a corkscrew up out of the crown that opens into the sky), then a few
//                      jinking round the roofs through the night; every bat a membrane silhouette — the arm, the fingers fanning to
//                      the tip, the scalloped trailing edge, the ears — the leading edge rim-lit by the neon)
//                      second, the bat banking into it), fast scalloped wings — core/harbor-flight.js#batAt
//   GEESE   sky(c)     V's crossing a sky lane (never across the sign): never a perfect V — uneven arms, irregular spacing,
//                      birds drifting in their slots, 1–2 stragglers trailing with a gap (flapping harder), now and then one
//                      dropping back + rejoining or two trading places (core/harbor-flight.js#geesePlan); the wingbeats ripple
//                      down each arm; autumn's head south (away: they shrink into the haze), spring's come toward us
// Every path is a function of (its seed, the seconds since the flight began): frame-rate independent, no per-frame dice.
// (The bats' old JITTER: they rode the raw roofline — a step function with 50–90 pt jumps at the building edges — so a bat
// teleported up and down as it crossed one, flickering when its ±6 pt wobble straddled an edge. Now: core#smoothRoof.)
//   HERON   sky(c)     the district's rare slow crossing on spring-to-autumn nights (neck folded, legs trailing) — &force=heron-sky
//                      (8b1: &force=heron is the heron on its PILING at dawn now — wildlife.js)
// Reduced effects: no birds on the wing (the district's rule). Heavy events elsewhere thin them (fs.density).
```

## js/core/harbor-promenade.js

```js
// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE's plan (PURE — tested in tests/harbor.test.mjs; drawn by screens/harbor/stage.js).
// What the near stage IS — its bands, where every lamp, tree, bench, cart, planter and the medallion stand, the
// trees' season by the real date, the IMPLIED ROAD along the bottom edge (cars shown only as light) — not how it looks.
//
// The bands, back to front (world z; the camera's numbers in docs/harbor.md — on a 402 phone the promenade is the strip from the
// road's near kerb, y ≈ 682, down to the dock's top, y ≈ 758):
//   THE WATERSIDE ROAD   z 54–64 (core/harbor-layout.js: the bus, the cars, the two stop lights + the CROSSWALK between them)
//   THE CURB BAND        z ≈ 52.6: the crabapple's grate (PROM: NO LAMPPOSTS — the tall pair by the crossing is gone)
//   THE PLAZA / MIDDLE   z 41–48: open cobbles in front of the speakeasy's door (8 guests, the party line, crowds); the
//                        CENTREPIECE SPOT just right of the door (an Art Deco medallion in a ring of smooth stone); the bench,
//                        the vendor cart, the stone flower planters — in the clearly visible middle, never low by the dock
//   THE FRONT WALK       z ≈ 36.5–38: THE CAB STAND (a bench at the front curb facing the street, the framing maple behind it),
//                        the vendor cart left of the compass, the hydrant at the left curb (PROM: the two globe lamps are gone)
//   THE IMPLIED LAMPS    PROM (the owner, Oct 28 — LOCKED): no lampposts on the promenade at all; a row of street lamps on OUR side
//                        of the front street, just below the screen, behind the viewer (never drawn) — their warm light pools on the
//                        street under the dock + the promenade, brightest at the front curb, falling off toward the railing; the
//                        shadows climb UP the screen, away from us (core/harbor-light.js#IMPLIED)
// NO FLAGPOLE (the owner, 8a: flags only on holidays / special events — a later part dresses the lamp posts then)
//   THE IMPLIED ROAD     z < 36: its granite curb just under the dock's top edge, THE STREET below (FP2: full-bleed — setts, a
//                        streetcar track, a manhole, a drain); while the dock shows, passing cars are LIGHT only (headlight
//                        sweeps at night, a soft shadow by day); while it rests (hidden) the car itself rolls across (streetPlan)
// NOTHING ALIVE UNDER THE DOCK while it shows. Positions are by SCREEN FRACTION on an upright phone (every phone the same picture); a wide screen
// (desktop, sideways) repeats the curb band to the right and keeps the front row either side of the dock.
```

## js/audio/tape-stop.js

```js
// THE TAPE STOP IN WEB AUDIO (the TR-3B's power drain — docs/audio.md#the-tape-stop-in-web-audio).
// The owner's iPhone (Oct 25, 11:29): with the bend ALONE on, the AUDIO panel read NOT SOUNDING, the song clock still, 13 reloads
// failing; with it off, "sounding". Changing an <audio> element's playbackRate on iOS Safari stalls / silences it (and a reload keeps
// the bent rate, so every heal failed too). So the element's playbackRate is NEVER touched again. Instead:
//   PREPARE   as the craft arrives: the song's bytes (the file is in the cache: prefetch() fetched it before it played), the frames
//             covering the next ~42 s of the song from where the element is (core/mp3-slice.js: placed to one frame), decoded into an
//             AudioBuffer (~15 MB for 42 s; dropped after the run)
//   BEND      when the first bend is asked: an AudioBufferSourceNode starts at the element's exact song time, crossfaded IN over
//             `xf` s (the element's own gain down, the source's up — the same audio, so a linear fade sums flat), then the element is
//             PAUSED. The source's playbackRate is ramped (speed + pitch together, like a record losing power); two oscillators on
//             the rate make the WARBLE (a wow + a flutter) in the audio thread — no per-frame work. The song position is the exact
//             integral of the rate (core/tape-math.js), so the beat and the panel still read a song clock.
//   RELEASE   the rate ramped back to 1; then the element is SEEKED to where the tape got to (+ what it lost, for a room-clocked
//             song), played, and once its clock is SEEN MOVING (nudged once if it landed off) the crossfade back; the source stops.
//   WATCHDOG  the element's clock not moving within 1 s of play() → a fresh load at the right time (the caller's reload); still not
//             within 1.5 s more → the fade back happens anyway and the music's health watch (music.js) takes it from there: the rate
//             is 1, so its reloads work. A frozen graph, the page hidden, a new context or a new song ABORT the bend: the element
//             resumes at the tape's time at once, no fade.
//   DIRECT    on the direct path (no usable Web Audio) nothing is bent — the caller's duck is the only dip.
// Everything is injected so tests/tape-stop.test.mjs drives it with a fake AudioContext + element: the element's playbackRate is never
// assigned, a stalled element is reloaded, back-to-back runs never leave the music dead, a room-clocked song ends on the room's clock.
```

## js/screens/harbor/fireworks.js

```js
// CITY 2.0 — PART 10: THE FIREWORKS' RENDERER (core/harbor-fireworks.js plans the shows; decisions.md §6; docs/harbor/passes/part-10.md).
// ONE GPU PARTICLE ENGINE on its own WebGL2 layer right ABOVE THE CITY's CANVAS and BEHIND THE LIT NEON SIGN (the owner, Oct 31 9:05 pm:
// "the castle-and-fireworks postcard" — the sign stays on in front, the sky exploding round it; the city's crisp lettering stays in front
// too), only while a show is near (created ~20 s before, freed after its smoke) — CLAUDE.md's "a WebGL layer for a sky".
//   THE SPARKS   every spark is ONE instance: its origin, velocity, birth, life, drag + gravity — its flight is CLOSED FORM on the GPU
//                (v → the wind + the fall's terminal speed under drag: p = o + v₀·e + w·(t − e), e = (1 − e^(−kt)) / k), so the CPU only
//                writes a shell's instances ONCE (at its launch) and every frame is three instanced draws. A phone joining mid-show
//                builds the shells already up from the same seeds → the same sky. Each spark is a soft capsule from where it was a
//                trail ago to where it is (the chrysanthemum's + the willow's trails), cooling WHITE → its COLOUR → EMBER as it falls.
//   THE SHELLS   peony (a sphere seen: the rim denser), chrysanthemum (trails), gold willow (long, slow, drooping gold), palm (thick
//                arms), ring (a tilted circle), crossette (stars that split in four), glitter + strobe + crackle (twinkle / flash /
//                the last-moment pops), comets (a few big tailed stars), multi-break (a second, inner break); the rising COMET of each
//                launch with its spitting tail.
//   THE CITY     every burst LIGHTS the city (a wash in its colour, falling off with distance — strongest on the buildings, softer on
//                the water + the speakeasy, faint in the sky), the SMOKE (puffs that build up over a show, drift on THE WIND, lit from
//                inside by the next bursts) + the WATER (the near layers mirrored + rippled in the harbor; the scene adds the light
//                columns — water.light). THE LAYERS: the barges + the lighthouse in front of the skyline (hidden by the speakeasy,
//                its billboard, the signs), the far shells BEHIND the towers (the roofline masks them).
//   THE TIERS    THE TIER TABLE (fwSparks, fwTrails, fwSmoke, fwLights, fwMirror, fwDpr, fwRing) — fewer sparks, never ugly.
// No WebGL2 → ok() is false and the scene keeps the district's 2D fireworks (never broken).
```

## js/screens/harbor/vehicles.js

```js
// CITY 2.0 — THE HARBOR, POL4: THE VEHICLE KIT — the city's period motorcars (~1915–1935), shared by every road: the street under the
// dock (motorcar.js, the implied road's pass), the back road by the crossing (traffic.js) and 8b's police cars, cabs, the bootleggers'
// truck + the trash truck (new MODELS of the same shape). The owner (FP3b note 11 + POL4's add-on): "too CARTOONISH — rebuild them as
// late-1920s / early-1930s MOBSTER cars … a VARIETY … never the same car twice in a row … premium, readable at phone size".
//
// THE MODELS (side view, facing right; world units, 1 ≈ 0.85 m): each a set of numbers + a few style flags read by ONE painter:
//   modelT    the 1920s Ford Model T sedan — tall + upright, a flat brass-rimmed radiator, slim cycle fenders, wooden artillery wheels
//   modelA    the 1929 Ford Model A Tudor — a tall nickel radiator shell, a crowned roof, two-tone paint, wire wheels
//   packard   the big Packard / Cadillac sedan (the mobster's car) — a LONG louvred hood, a tall chrome shield grille with its vertical
//             bars, big headlamps on a bar + a pair of fog lamps, a SIDE-MOUNT spare in the front fender, chrome wire wheels on
//             whitewalls, a trunk on its rack, deep paint
//   roadster  a two-seat roadster with its top folded down + a RUMBLE SEAT behind (its lid open now and then, a passenger in it)
//   coupe     a close-coupled coupe — a short cabin, a long rear deck, a chrome strip along its belt
//   van       a panel delivery van — a tall box body with its trade lettered on the side (the bakery, the laundry, the ice man)
//   taxi      a Checker-style cab — yellow over black, the CHECKER BAND along its belt, the TAXI lamp on its roof
// THE LOOK (every model): deep GLOSSY paint (a lit shoulder band, the sky's reflection along the crown, a darker skirt), chrome glints
// (crisp white specks on the grille, the lamps' rims, the bumpers, the hub caps), panel seams + door handles, the windows mirroring the
// sky with a driver behind, the fenders sweeping into the running boards; at night deep tones lit by the street lamps (a 'lamp' look)
// with the lamps LIT (live: motorcar.js / traffic.js — headlamp cores + tight halos, the tail lamp an ember); party nights a few carry a
// soft NEON UNDERGLOW + lit trim (live — drawUnderglow).
// BAKED once per model + look + paint + size into a sprite (bodySprite) + a wheel sprite per wheel kind (wheelSprite: its still tyre +
// its turning part); only the wheels turn live.
```

## js/config.js

(FREEFALL F4A, Nov 26 2026 — THE BOOT's BYTE ROOM: the boot stood at 6,499 of 6,500 KB; FREEFALL's hidden rows needed 1.3 KB. The three
comment blocks below moved here VERBATIM; the file keeps one line each.)

Above `GAMES`:

```js
// THE GAMES (lobby order). WINDOWS (the owner, Nov 1): ONLY PRISM DROP + OVERCLOCK are PLAYABLE (+ HOLD'EM since HE10, Nov 11) — `playable: false` HIDES a game
// everywhere a player could start it (the lobby's picker, HOW TO PLAY, the title's games sheet, host.js#startGame refuses it — a rematch,
// an invite or a stale link included); its code, data + rules stay, FROZEN (FROZEN_IDS below — docs/cartridge.md "THE FROZEN CONTRACT"). The city's
// signs come from core/harbor-neon.js#signRoster (the playable games, minus THE SIGN HOLD) — FIXES R2: the old `sign` flag is gone (nothing read it).
// A game comes back = playable: true (and off FROZEN_IDS — derived, nothing to edit).
```

Above `DAILIES`:

```js
// PW1 — THE DAILIES: the DAILY-ONLY cartridges (docs/password.md). NOT in GAMES on purpose: GAMES is the lobby's list — it drives the city's
// game signs, HOW TO PLAY, THE BOARD's catalog + the match reports, and a daily is none of that (never playable in a room, no sign). THE DAILY
// MODULE opens these once a day, later; until then THE PASSWORD is reachable only through its preview + its E2E. `gameRow(id)` = either list.
```

Under `DAILIES` (a row's fields):

```js
// FIXES R3 — `measure` = the daily's MAIN MEASURE: the SHARE CARD's ONE big score (js/daily/share.js#measureOf — 'guesses' | 'time'; a new daily declares its own).
// DM1 — PLUG-AND-PLAY: every row's `order` (the picker's order), `ticket` (its ticket art key — DM2), `lesson` (a first-time lesson — DFIX3's
// ONE-TIME HINT under the board, the cartridge's HINT line), `on` (in the set). DM2: `hook` = the TODAY row's one line (else `tag`). THE DROP B: `ownMusic` = the run plays its own songs (the console's decks stay silent). The server opens a row only while THE GO-LIVE SWITCH is on (api/_lib/dailies.js) — `on` alone opens nothing.
```

Above `FROZEN_IDS`:

```js
/** FIXES R2 — THE REVIEW B1, option (b) "KEEP COMPATIBLE" (the owner, Nov 15): the FROZEN games — not playable, not being built (`preview`). ONE
 *  list: games/registry.js#loadGame refuses them (never loaded — an emulator-only `&frozen=1` for tests), the whole-tree tests read it for
 *  their exemptions; their pure logic.js + director.js stay importable + their sims green; their views, CSS, E2Es + previews are NOT maintained. */
```

Above `ownerPhone` (HE8):

```js
/** HE8 — THE OWNER'S LIVE TEST: this phone got the server's OWNER yes (the radio's gate — `radioWho`, ADMIN_PIDS: screens/harbor/radio-gate.js).
 *  A game being built (`preview: true`, `playable: false`) then shows in HIS room's game list with a TEST tag and starts from his host phone —
 *  only a convenience: the dealer's start checks the host is the owner itself (api/_lib/holdem-store.js#startOpen) and refuses everyone else.
 *  Nobody else's lists, signs, THE BOARD or the city change. `playable: true` later simply opens it to all. */
```

## js/screens/harbor/boats.js

(moved FREEFALL FIX A, Nov 27 — the boot's byte room for FREEFALL's go-live)

```js
// CITY 2.0 — THE HARBOR, Part 5: THE BOATS (docs/harbor/passes/part-5.md#the-boats). Each sails on the clock (core/harbor-boats.js: the
// routes, pure + tested). 8b2 Group 3 — THE BOATS IN 3D: every boat is a real MODEL now (boat-models.js on boat3d.js's kit) in
// the Harbor's own camera, posed by its heading, so it TURNS on the water (bow, three-quarter, side and stern views all true):
//
//   ROSIE      the riverboat: a white hull over a broad navy boot-top + a gold pinstripe (9a), three decks of arched windows, the pilothouse, twin black
//              stacks with feathered crowns + a gold band, the stern PADDLEWHEEL under its red hood with her name (the wheel
//              turns live — between her back and front: you see it from astern, it hides behind her from ahead), flagstaffs +
//              pennants, lifebuoys; at night every window warm and STRINGS OF BULBS from the bow staff over the stacks to the
//              stern staff (a scheme hook: set({ rosie: 'valentine' }) — 11c's dinner cruise; 'parade' — 11b's lit boat parade;
//              set({ chase }) — Part 10's chase along the strings); coal smoke off her stacks while she's under way
//   THE TAXI   a yellow water taxi with its checker band, zipping across in front of the pier head, bow up
//   THE TUG    (night) red + black, its fender at the bow, the wheelhouse high, the stack, the towing lights on the mast
//   THE FISHING TUG  the tug's build in white + green; its bow lantern at the stem while it's out in the dark
//   SAILBOATS  (day) a white sloop, main + jib on the leeward side, cambered, heeling in the real wind; they TACK through it
//
// THE CACHE: each boat's look is rendered into a sprite keyed by its heading (½° Rosie, 1° the rest), its view angle (the
// perspective shifts as it crosses: x / z in steps of 0.012), its depth, the tones + the scheme — a boat sailing straight costs
// a blit; it re-renders only when the key changes (a turn: a few times a second). Live per frame: the bob, Rosie's wheel, the
// bulbs while they chase, the running lights (green starboard / red port on the TRUE heading: the side facing us), the smoke,
// the noon steam plume, the lantern, the blackout's dark glass (f.power), the wakes (curving with the turn) and the
// REFLECTIONS (the same sprites, mirrored about each boat's waterline through water.reflect; the taxi's own per frame).
```

## js/screens/harbor/moon.js

(moved FREEFALL FIX A, Nov 27 — the boot's byte room for FREEFALL's go-live)

```js
// CITY 2.0 — THE HARBOR, Part 6a: THE MOON, THE SUN'S HAZE, THE AURORA — the art (the real timing, path and phase are core/sky.js's
// + the framing harbor/fx.js#moonPlace with the Harbor's arch: unchanged). docs/harbor/passes/part-6a.md.
//   THE MOON    THE REAL MOON (the owner: "the craters look off"): a PHOTOGRAPHIC map of the near side — assets/moon-near.jpg, an
//               orthographic disc made from NASA's CGI Moon Kit (LRO LROC WAC colour mosaic, lroc_color_poles_2k; NASA Scientific
//               Visualization Studio, svs.gsfc.nasa.gov/4720, public domain), 256 px grayscale. The maria (the man in the moon),
//               the bright highlands, Tycho's rays — no drawn craters. Lit per pixel (Lommel–Seeliger: the full moon's flat even
//               light, a quarter's gentle fall toward the soft terminator), turned to the player's REAL SKY (moonSky: the
//               lunar north from the ecliptic pole, the bright limb toward the real sun — tilted at moonrise, upside down in
//               the south). Loaded lazily; missing / blocked → the old crafted texture below (the fallback, same orientation).
//               The fallback: the near side's maria where they really are (Imbrium, Serenitatis, Tranquillitatis,
//               Crisium, Fecunditatis, Nectaris, Nubium, Humorum, the Ocean of Storms, Frigoris), bright Tycho with its rays,
//               Copernicus, Kepler, Aristarchus, a field of craterlets; its REAL PHASE with a soft terminator; EARTHSHINE on the
//               crescent's dark part (the maria faintly there); a big AMBER MOONRISE (bigger + amber low, shrinking to silver
//               as it climbs; the harvest moon stays amber longer; a supermoon a touch bigger); a wide soft gaussian glow
//               (wider in haze), a tight corona in clear air and a faint 22° HALO only under a cirrostratus veil, never across
//               the tagline (SP); a lunar eclipse (the real dates) turns it copper-red
//   THE SUN     (harbor/sun.js draws the disc) + the golden hour's haze: the low sun's warm air along the horizon
//   THE AURORA  slow curtains of rays — a sharp green lower border fading up through teal into violet and red (a storm night:
//               higher, redder, brighter) — rendered small a few times a second and drawn as one soft image
```

## js/screens/harbor/jets.js

(moved FREEFALL FIX A, Nov 27 — the boot's byte room for FREEFALL's go-live)

```js
// CITY 2.0 — THE HARBOR, PART 6b → Oct 25: THE JETS — ONE stealth fighter shared by the TR-3B's CHASE, THE AIR SHOW (a diamond of four,
// smoke on), THE MISSING MAN (a finger-four, #3 pulling up and away) and THE SURPRISE FLYBY (docs/harbor/passes/the-tr-3bs-music-the-f-22-no-traffic.md; plan.md "THE JETS →
// AN F-22 RAPTOR-STYLE STEALTH FIGHTER": the F-16s "look too cartoonish — they need to look like modern, real, menacing flying death
// machines"). Seen from below + the side as they cross. Realism at phone size comes from SILHOUETTE + SHADING:
//   THE AIRFRAME   the angular FACETED body — a chined forebody with a hard light / dark edge along it, the long gold-tinted bubble canopy,
//                  the raked parallelogram INTAKES, the DIAMOND wing seen from just below, the big diamond stabilators, TWIN CANTED
//                  TAILS, the 2-D vectoring nozzles with SERRATED edges; INTERNAL weapons bays (their sawtooth doors closed on the
//                  belly — nothing hangs outside); dark GUNMETAL grey with real specular highlights (the sun along the spine + the chine,
//                  a hot spot on the canopy, a sheen across the fin) and per-panel shading (no flat fills, no thick outlines);
//                  low-visibility grey USAF markings (a grey-on-grey star-and-bar, the fin's flash); a sprite per (size, light), cached
//   THE AFTERBURNER (live, additive) a tapered plume from the nozzle with MACH DIAMONDS — 5 evenly spaced shock nodes: white-hot at
//                  the nozzle, then blue-white, violet, orange, a dim orange — crisp rhombi with a tight glow, flickering a touch; at night
//                  a soft glow round the whole plume (dimmer by day, still read); HEAT HAZE behind the engines (a shimmer of pale blobs)
//   MOTION BLUR    (live) on full burn the airframe streaks: two fainter copies trail it by a hair
//   THE LIGHTS     at night: the formation strips (the forebody's chine, the aft fuselage, the fin's tip), the near wingtip's nav light
//                  (green flying right: its starboard side is ours; red flying left), a white tail light, the beacon on the spine
//   VAPOUR + SMOKE a vapour cone round the wing on a hard pull (the air show), a white smoke trail by day (the air show's smoke on)
```
