# Part 5 — THE HARBOR'S HERO PIECES (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Part 5 — THE HARBOR'S HERO PIECES (Oct 21 2026)
- [x] 0. Small fixes: THE TAGLINE rests with the dock · THE RIGHT-HAND SIGN WALL: two named ROOF SIGNS (the owner's call, below) ·
  the catch in WebKit (below).
- [x] 1. The Ferris wheel, the pier + its platform, the lighthouse + the beam + the keeper's cottage, the boats (Rosie, the taxi, the
  tug, the sailboats) with wakes + reflections; hooks for Parts 10, 11a–c, 12. THE ELEVATED TRAIN: not built (the owner's rule:
  only if it reads — below).
- [x] 2. Perf + memory (A-B-B-A, below). 3. Review: day, golden, night, a foggy night at 390 / 402 / 430 / 1440 + close-ups (wheel,
  lighthouse, Rosie, the harbor strip; bursts for the beam, the taxi, the wakes); two refine passes. Docs.

### 0. The small fixes, as built
- **THE TAGLINE** (title.js#tagState, the owner's call): shown on arrival; it fades out together with the dock when the title's
  screen goes to rest (`is-idle`, 10 s without a touch — NEON PASS 6, was 15) and comes back with the dock on a tap — the old 15 s fade-for-good is gone.
  While it is hidden its band is sky-low's (`scene.set({ tagGone })`); the camera never moves (the skyline never grows into its
  space). THE TAGLINE SLOT keeps working, even at rest: `tagSlot(text, ms)` shows a message (`.nd-tag-msg`, visible over
  `is-idle`), then the tagline comes back in its place. `&tagms=N` (dev + shots): the tagline alone fades N ms in, as at rest.
- **NAMED ROOF SIGNS** (asked + decided Oct 21 2026): on the reference phone every right-side roof sits right under a word
  face (the faces end at 487 pt, the roofs at 486–512) and the open sky between is a sun corridor or the lighthouse — so the
  owner's rule: **the roof signs stand on the WORD TOWERS' top roofs, in the open sky above their crowns; under the skyline
  limit; out of the sun corridors; the towers' beacons on top of the sign frames; while a tower spells a word its roof sign dims
  (to 22 %, over ~1 s) so the message stays the star.** `n-roofA` (wordA) + `n-roofB` (wordB), `mount: 'tower'`, 52 × 18 ref pt
  (`core/harbor-neon.js#towerRoofSign`: centred on the roof, trimmed to keep `CORRIDOR_PAD` 3 pt from a corridor, shrunk under
  the limit; null when it cannot stand); a riveted steel frame (`signs.js#roofFrame`: lattice legs on the roof's edges, a girder,
  X braces, a catwalk, the beacon's post). They took **i-c2** and **i-par2** off the right wall: 6 named + 6 icons on a phone,
  every game still has a sign. Tested at six sizes (+ the E2E: the beacons on the frames, under the limit).
- **THE CATCH IN WEBKIT** — see "Known issues (Part 5)".

### THE FERRIS WHEEL (`screens/harbor/wheel.js`)
- A real steel wheel, turning on the real clock (one turn in 150 s: every phone shows the same angle): the rim (two rings + the
  zigzag truss), 16 pairs of tension spokes crossing to the hub + 16 radial struts, an inner ring, the hub's plate and bolts —
  ONE sprite per look, rotated each frame. Painted red steel by day (the sun's side of the rim catches the light: an arc drawn per
  frame — it must not turn with the wheel), plum at golden hour, a warm-lit plum at night (it catches its own bulbs).
- **16 gondolas** hang level from their pivots on the rim and sway a little (each its own phase); four paint colours by day; at
  night their windows warm (a few empty and dark).
- **The bulbs** (night, with the city's power): 48 on the rim (three chase sets), 64 on the spokes (four rings), a star round the
  hub — one sprite per set, rotated with the wheel. **THE SHOW** (48 s; 24 s on a party night): steady (a soft twinkle) → a chase
  round the rim → the rings pulsing outward → a sparkle. Tier 0 + reduced motion: steady. A warm haze round the wheel + its pool
  on the platform's deck.
- **The A-frames ON THE PIER** (the owner's catch): the pier widens into a PLATFORM under the wheel (`L.pier.head`: ± (leg · r +
  1.4) around the wheel, z ± 6), so both A-frames' feet stand on its deck, 1.4 units in from its edges (tested at six sizes;
  E2E). The back A-frame is baked with the pier; the front one is a sprite over the wheel.
- Reflected through `water.reflect` (the mirror's 10 a second: the wheel is slow). Colour hook: `harbor().wheel.scheme(name)` —
  `WHEEL_SCHEMES`: city (warm white), party, halloween (orange / purple), christmas, valentine, stpatrick, july4, nye,
  thanksgiving, easter. Preview: `&force=wheel-scheme&scheme=halloween`. A tap → `{ kind: 'wheel' }` (Part 12: a gondola rocks).

### THE PIER (`pier.js`, baked)
A timber pier from the far quay out to z 118, its platform under the wheel: round pilings in pairs (a middle row under the
platform) with X braces, wet dark feet, the deck's dark underside; the deck in planks (alternate boards a shade apart, the seams,
a sheen by day, worn edges), the fascia, railings (posts + a top + a mid rail; across the platform's ends); the boarding plinth
under the wheel; a Deco ticket booth with a striped awning (its window warm at night); lamp posts (`pierLamps`: the platform's four
corners + along the walkway) lit per frame at night with a column in the water each (`water.light`); the pilings' faint
reflections baked under them.

### THE LIGHTHOUSE + THE BEAM (`lighthouse.js`)
- Baked: a rubble breakwater (granite boulders, sunlit tops, wet feet), a granite plinth in courses, the tapering tower — white
  with two red bands, SHADED AS A CYLINDER toward the real sun's side, a rim light at night — slit windows up a spiral (the top
  one lit at night), a door under a hood; the gallery on corbels with its railing; the LANTERN ROOM glazed between diagonal
  astragals (the sky in the glass by day, the lamp's warm light at night); the copper dome, its ventilator ball, the lightning
  rod; THE KEEPER'S COTTAGE (white clapboard, a red roof + chimney, warm windows at night, a picket fence).
- **THE BEAM** (per frame, `createBeam`): two beams opposite each other turning on the real clock (16 s a turn); each a CONE from
  the lantern, slightly dipped, foreshortened as it swings toward / away from us; pointing our way it FLARES (a star in the
  lantern + a flash down the water: `water.light`). It lights the haze round the lantern; reflected in the harbor
  (`water.reflect`); softened while a word spells. **Real fog** (`LK.fog`): brighter, wider — the dramatic night (and on a
  foggy day it is on, dimmer). Reduced motion: a steady beam to the side. Tier 1: one soft layer a fan; tier 0: no flare star.
- HOOKS: `harbor().lighthouse.set({ colour: [r,g,b] })` (11a: the Halloween green — preview `&force=beam-green`), `.spin()`; a tap
  → `{ kind: 'lighthouse', spun }` — three taps within 1.5 s spin the beam for 5 s (Part 12's egg; the scene keeps 60 fps).

### THE BOATS (`core/harbor-boats.js` PURE + tested, `screens/harbor/boats.js`)
- **On the clock**: each boat's place is a function of the real time alone (`boatAt(route, ms)`) — every phone shows the same
  harbor, a refresh lands it where it was; a cycle of segments (move with an easing, hold, turn, away). **They never cross the
  pier** (it runs from z 118 to the quay): everything beyond the pier head sails right of it (on screen, right of the platform's
  front corner + 3 pt — tested at six sizes, a day sampled); the WATER TAXI runs in front of the pier head and crosses the whole
  harbor. A boat TURNS by foreshortening (its side view squeezes to the bow and opens the other way).
- **ROSIE** (z 142, ~101 pt): BACKS IN from the right to her landing beside the platform (6b: astern — she never turns in sight until her 3D model), four minutes alongside bow-out, steams out —
  ten minutes a cycle. A white hull with a red boot stripe, three decks of arched windows with the shadows under their overhangs,
  the pilothouse, TWIN STACKS with feathered crowns, the red paddle box with her name (a pre-mirrored sprite: the name reads the
  right way both ways) and the PADDLEWHEEL turning while she moves; flagstaffs + pennants; at night every window warm and STRINGS
  OF BULBS from the bow staff over the stacks to the stern staff.
- **THE WATER TAXI** (z 94, ~38 pt): yellow, its checker band, a white cabin, a flag; zips across in 11 s (bow up), a minute
  between crossings; its own reflection per frame (too fast for the mirror's 10 a second); it keeps the scene at 60 fps while it
  crosses (`boats.busy()` → `fastNow`). `&force=taxi`: back and forth without a break (perf + review).
- **THE TUG** (night, z 214, ~27 pt): red + black, the bow fender, tyre fenders, the wheelhouse high, the stack, the towing lights
  on the mast. **THE SAILBOATS** (day, z 205–214, ~19 × 29 pt): white sloops, main + jib lit on the sun's side, HEELING in the
  real wind (`LK.wind`), tacking. The tug and the sailboats ride Rosie's ten minutes, PHASED so they come to the pier while her
  landing is empty — never idling unseen behind her (tested). A day / night boat is decided per CYCLE from the hour at its start
  (never pops in or out at dusk; tested across dusk).
- Every boat: a gentle bob, running lights at night (green to starboard — the side we see heading right — red to port; the
  tug's white masthead lights), **THE WAKE** drawn every frame from its own past path (`boatAt` at earlier times: the foam stays
  in the water where the hull passed, spreading and fading — the wash on the track, the Kelvin V's two arms, a bow wave; Rosie's
  paddlewheel the most) — not through `water.wake()` (read 10 a second), and **its reflection** (`water.reflect` about its own
  waterline; the taxi's own). Reduced motion: the boats hold still where the hour began, no wakes. Tier 0: no wakes (below).
  The wakes' samples are re-taken 10 a second and drawn into a small image per boat (only the taxi's head is stroked live); the
  boats are drawn AXIS-ALIGNED (the sailboats' heel in the real wind and the taxi's bow-up pitch are baked into their sprites — a
  rotated image is the slow path).
- **THE WATER LANE'S QUIET** (the owner's call, Part 5's perf review — instead of lowering anyone's look): while a BIG SHOW runs
  (two of: the party peak, the searchlights, a word in the windows), or the scheduler's heavy event quiets the water lane
  (`density.water`), or on TIER 1 a party night, the EXTRA BOATS wait: the taxi skips its next crossing, the tug its next visit.
  Decided only while the boat is out of sight (`boatRoutes` gives each stretch in the water a RUN; an away boat names the next one —
  tested), so nothing pops; one already on the water finishes. Rosie and the sailboats always sail. The readout shows "water quiet".
- **TIER 0 (the calm city):** no wakes, the beam one soft fan without the flare star, the wheel's image refreshed 4 a second, the
  taxi crossing every other time — every piece still there.
- HOOKS: `harbor().boats.set({ rosie: 'valentine' | 'parade' | 'party' | 'halloween' | 'christmas' | 'city' })` (her bulb strings:
  11c's dinner cruise, 11b's lit boat parade; preview `&force=rosie-lights&scheme=parade`); a tap → `{ kind: 'boat', id }` (Part 12:
  its horn). New boats (the ghost ship 11a, the party yacht Part 10, the parade's boats 11b) join `boatRoutes` as new routes.
- Draw order: the far boats (z > 150: behind the lighthouse) → the baked harbor layer (pier, platform, back A-frame, breakwater,
  lighthouse, cottage) → the beam → Rosie → the wheel (+ the front A-frame, the pier lamps) → the taxi (in front of the pier head).

### THE ELEVATED TRAIN — not built (the owner's rule: only if it reads on an iPhone)
Size-checked on the reference phone before building: on the far waterfront (z 230) a car is ~7 pt tall and ~36 pt long, its
windows ~2 pt; its track would run at 550–558 pt — between the signs' bottom edge (545) and the quay's top (566), across every
hero block's ground floor and right through the quay lamps and their columns in the water; and the wheel, docked Rosie and the
lighthouse cover ~60 % of its run, so a passing train shows in pieces. At night the lit ribbon would read; by day a 7 pt train is a
grey line, not a crafted shape. So it is NOT shipped (the owner asked to be told instead). Options for the owner: (a) the train on
a taller viaduct further back (z ~ 300, above the near band's roofs: it then crosses the skyline's lower windows — a tradeoff),
(b) desktop only (the panorama has open waterfront either side), (c) drop it for City 2.0. Its hooks would be `trainGap`
(district/street.js) + a route on the clock like the boats.

### Performance + memory (Part 5 — A-B-B-A against 6ebd5c7, the commit before)
Measured on a quiet machine (9 % CPU, on power), one after the other: previous, Part 5, Part 5, previous — `title-perf.mjs --city 2`
(390×844, DPR 3 capped to the tier, 4× CPU, mean ms of scene work, each number the mean of its two runs; frames 16.7 ms everywhere).
`h-night` = a night with the water taxi crossing non-stop (`&force=taxi`); `h-worst` = the neon's party moment + the searchlights +
a word + REAL FOG (the beam at its widest) + the taxi. **Bold = over the budget.**

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| day (`np-day`) | 4.13 → 5.08 | 3.62 → 4.03 | 2.91 → 3.11 |
| night (`np-night`) | 5.50 → 6.74 | 4.75 → 5.93 | 3.39 → 3.88 |
| golden hour (`np-golden`) | 5.58 → 6.78 | 4.59 → 5.50 | 3.53 → 3.99 |
| party (`np-party`) | 6.62 → 7.62 | 5.46 → **6.41** | 3.69 → **4.05** |
| the stack (`neon`: party moment + searchlights + a word) | 6.89 → **8.12** | 5.39 → **6.32** | 3.73 → **4.75** |
| the harbor's night (`h-night`) | 5.46 → 6.75 | 4.51 → 5.64 | 3.18 → 3.79 |
| the worst (`h-worst`) | 7.07 → **8.02** | 5.69 → **6.40** | 4.16 → **4.95** |

What it took (the first build measured +0.9–1.6 at tier 2 and +0.6–1.1 at tier 0, profiled + A/B'd piece by piece with the new
`&force=no-boats|no-wakes|no-wheel|no-beam` and the `h-nb, h-nw, h-nwh, h-nbm, h-none` perf scenes): THE WHEEL turned inside a
cache image refreshed 20 / 10 / 4 times a second (one plain draw a frame, reused by the mirror; the bulb sets in one draw while the
show is steady); THE BOATS drawn axis-aligned (the bob as a shift; the heel + pitch baked: a rotated image cost them 0.7 ms at tier
0); the wakes re-sampled 10 a second into an image per boat; the pier lamps one sprite; the beam one layer below tier 2. Then the
owner's calls: TIER 0 calmer (no wakes, no flare star, the wheel 4 a second, the taxi every other crossing) and THE WATER LANE'S
QUIET (the extra boats wait during a big show / a heavy event / tier 1's party night) — nobody's look lowered.
**Still over (reported to the owner, no further cuts without her call):** the party night at tier 1 (+0.41) and tier 0 (+0.05), and
the stacked shows (the stack at every tier; the worst at tier 1 + 0 — the previous commit was already over at tier 0 there). The
E2E's party peak (its own page, a Saturday with the planes): t2 6.97 · t1 6.65 · t0 4.64. Memory: 28.65 MB of 64 at 390×844 tier 2
(+3.2: the wheel's sprites + cache 2.7, the boats' 0.5); 20 title ↔ setup cycles leave the same MB. The calm frame rate holds:
the wheel, Rosie, the tug and the sailboats all move slowly (30 fps is smooth — the wheel's rim moves ≤ 0.25 pt a step); the taxi
crossing and the spinning beam bring 60.

### Known issues (Part 5)
- ~~**THE CATCH ON iPHONE — not checked in WebKit.**~~ — CLOSED (Part 6a): the owner checked it on her iPhone — no dark flash. Playwright's WebKit download hung (0 bytes in an hour) and was removed; no other
  WebKit browser is on this machine. The owner's own iPhone check stays: open `?city=2` at dusk (or `&when=…T18:5x`) and watch the
  NEON sign's catch for a dark flash. If it shows, the suspect (cleanup pass 1) is WebKit promoting the glow paths to layers as
  their opacity transition begins (`will-change: opacity` on the premium logo's `.ndl-glow1/2` during `.is-catch`).
- **The budget is still over in the party / stacked scenes** (the table above) — the owner's call pending.
- **The wheel idles at 30 fps** (the calm rate; cleanup pass 1's open question, decided by measurement: smooth at 2.4° a second).
- The perf bench is software-rendered (headless Chrome, no GPU): a rotated `drawImage` is its slow path, so the hero pieces avoid
  rotated draws per frame. A real phone's GPU canvas is likely cheaper — the `&debug=1` readout shows the real numbers there.
- At tier 0 the taxi's reflection is the mirror's (10 a second): it steps a little under the ripples.
- The far half of the beam crosses the word faces' lower rows on a side sweep (softened while a word spells; the faces' letters stay
  brighter).
- A boat's thinning (the water lane's quiet) is per page: during a big show two phones may differ on whether the taxi crosses.
- `water.wake()` is unused (the wakes are drawn per frame from each boat's own path) — kept for later parts.
- The breakwater (Part 1's layout: the lighthouse x −20 … +34) shows as a rubble strip in open water left of the lighthouse when
  Rosie is out; plausible as a jetty, flagged for the owner's eye.
- Desktop: the pier recedes at an angle from the wheel (left of centre) to the quay — correct perspective; Part 12's desktop pass.

### Handoff → Part 6 (sky hero pieces)
The harbor's hero pieces are done; Part 6 rebuilds the sky's artwork (planes, the banner plane, the helicopter, jets, birds, the
UFO, satellites) on the existing systems. Things to know: the scene's calm rate (30 fps) holds while the wheel turns, Rosie, the
tug and the sailboats move (all slow); a fast thing (the taxi, the spinning beam) returns from a `busy()` read in `fastNow`. The
party yacht + its helicopter (Part 10) land on the water: add a route to `core/harbor-boats.js` (on the clock, right of the pier;
tested like the others) and a sprite + lights in `boats.js`; the helicopter is Part 6's art. The beam is over the city's fog
layers and under the near stage; a plane passing behind the beam needs nothing. Measure with `title-perf.mjs --city 2 --scenes
np-night,np-party,neon,h-night,h-worst` A-B-B-A.
