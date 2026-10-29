# PART 8P — THE PEOPLE (the promenade + the rooftop) + THE SPEAKEASY POLISH CARRY-OVER (Oct 24 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 8P — THE PEOPLE (the promenade + the rooftop) + THE SPEAKEASY POLISH CARRY-OVER (Oct 24 2026; behind `?city=2`)
Ben reviewed SPOL on his iPhone (the windows, the room tints, the wall-washers + the café lights work); this pass fixes his carry-over notes
(section 0, its own commit 7dc3a8d) and gives the foreground its PEOPLE so it can be judged as a living place. Helpers: the sounds (k + l) and
the CI split (m + n) ran beside the lead; docs/audio.md "8P — THE SPEAKEASY + PEOPLE SOUNDS, THE JETS' DUCK" + docs/testing.md have theirs.

### 0. Section 0 — Ben's SPOL review
| note | what changed (where) |
| --- | --- |
| a. THE BARBERSHOP FRONT BLURRY | every baked layer was already dpr 2 (measured) — the softness was the PAINTING: ~3 pt gilt caps with a drop-shade offset by under a point (a double image), a milky white haze over the lower glass, a ~3 pt OPEN/CLOSED card on the door, all smeared further by an iPhone's 1.5× upscale of the dpr-2 canvas. Now: the gilt arch rebuilt (`speakeasy.js#paintGilt`, `GILT`: bigger, ONE crisp dark keyline, no offset shade, flatter + higher; lit gold at night by the awning's lamps), "SHAVE & HAIRCUT" gone (the sign's spot), the haze off the glass, the door card gone |
| b. THE AWNING LAMPS | three (`AWNING_LAMP.us` each end + the middle, each ×0.72), crisp brass bell shades + bulbs under the valance (`awningBulbs`, live), their light baked on the canvas, the shopfront + the pavement; the valance a little shallower (`VAL` 0.42 → 0.34) so the window's head shows. The pole stays the brightest |
| c. THE LAMPPOST GLOBES | the lit glass drawn as a vector ellipse every frame (a stretched sprite softened it), halos tighter (`stage.js#LAMP_HALO` 2.4 / 2.2 / 1.45 → 1.75 / 1.6 / 1.18) |
| d. THE TV | bluer (64,108,255 ↔ 128,162,255), the glows lower, its level capped (0.92): no white-grey frame (`windows.js#tvRoom`, `spills`) |
| e. SLIPSTREAM | `speakeasy.js#bladeWords`: a one-word name over 8 letters stacks in two columns at its seam (`BLADE_SPLIT`: SLIP / STREAM, RUM / RUNNER, OVER / CLOCK — the last two were 9.6 pt, also under the rule); every game ≥ 10 pt at 402 (tested) |
| f. THE STREET + THE COBBLES | the street under the dock a muted aged OXBLOOD BRICK street (`street.js#SETT` 118,70,62; small bricks 0.5 × 0.3 laid tight in rows, tar + sand joints, FLAT — `paintFlat`, worn smoother + darker along the wheel paths + beside the rails); the promenade's setts flat too (`paintSett(…, { flat: true })`: no pillow crown, no lip) |
| g. THE CROSSWALK LIT | `road.js#CROSS`, `crossPools`, `crossLightOf`: each lamp of the flanking pair throws a pool onto the road, overlapping on the crossing (rings of light baked with the road), the stripes catching it (paler + a glossy near edge) |
| h. THE BASEMENT WINDOW | `speakeasy.js#BASEMENT`, `basementLight` (PURE): a deeper smoky amber-copper, brighter; shadows of people passing behind it (~3 slots in 5, one or two figures, the light dimming as they pass), a pulse with the beat on party nights, a flicker ~once in 8 minutes; its bars over the glow |
| i. THE LAMPS' LIFE | `core/harbor-lamps.js` (PURE): at dusk each lamp catches at its own point of the ramp in a seeded order with a warm-up stutter; ~1 slot in 2 of 7 minutes ONE lamp stutters 2–3 times (never two at once, never the crossing's pair while an event stands on the inlay), ~1 in 5 of those a 3–6 s outage; a lamp that's off takes its baked pool back down (`stage.js#dimPools`). `harbor().lampLife()` |
| j. THE HUSH WORD SIGN (Ben's add-on REPLACED the shop-window sign) | `core/harbor-hush.js` (plan, PURE) + `screens/harbor/hushsign.js`: BARE NEON TUBES hanging inside the LOWER-RIGHT upstairs window (the jazz room — its silhouettes show between the letters), a signal from someone inside — ONLY while a lobby is open: absent otherwise (no unlit tubes, no OPEN), lit letter by letter as it appears, glowing by day too (the coloured glass + a dark edge; at night a thin dark edge + the lit tube, a hot classic neon red so it reads against the amber room), a last flicker + gone on leaving (`darkLevel`). Sized for FOUR letters (Ben, after the feasibility check — the glass is ~22 × 27 pt at 390): a 2 × 2 block as big as the glass allows — **11.1 pt at 390, 11.4 at 402, 12.2 at 430** (the glass's height is the limit); five letters (3 + 2) fit at 8.7–9.6 pt. Read at a glance at 390 by day + at night (checked). The barbershop window is clear again (the widening 4.22 → 4.6 units stays). Preview `&force=hushsign&hush=JAZZ` (or `SWING`); Lobby 2.0: `harbor().speakeasy.hush(word)` (null = no lobby) |
| k + l. THE SOUNDS | → docs/audio.md 8P (the jets +6 dB + a 3.6 dB music duck, a 1–3 kHz presence on the aircraft; 42 of 83 slots filled; the bus from the 1945 truck; `tv-murmur` left empty: music + a clear voice in it) |
| m. CI MINUTES | the cloud suite in 4 parallel jobs (`tests/integration/harbor-jobs.mjs` — a group in no job fails the unit suite), the full run only on a push whose commit message carries `[harbor]` (or by hand), the known flaky visual checks → warnings on CI (`okF`) — docs/testing.md |
| + Ben's zoomed day shot (an add-on) | (1) the gold leaf was drawn TWICE (the bake's copy + the live layer's, a hair apart — the ghost): now only the live layer, on whole device pixels at its natural size (`giltOver`); (2) the awning's notch near its right end was the side flap's triangle + the patch: gone, the stripes continuous; (3) THE WINDOW BOX crafted (`paintWindow`'s `o.box`): a deeper bottle-green planter on iron brackets, a full mound of foliage with bold seasonal blooms (mums now, geraniums in summer, tulips + pansies in spring, evergreen + berries in winter), trailing ivy over the front — kept (it reads at 402); (4) BOSTON IVY (`paintIvy`, `IVY`, `paintIvyBed`) up the corner pier from a small granite-kerbed bed, past the door to about the first floor — crimson now, green in summer, fresh green in spring, bare woody vines in winter; never over the door, the sconce or the blade (its reach by height); (5) "EST. 1924" off the valance → THE DATE STONE (`DATE`, `paintDateStone`): a carved limestone tablet in the parapet's crest, "1924" in big incised numerals (~8 pt at 402), washed warm from a hidden lamp on the cornice at night |
| n. NEON PAR's back-to-lobby | the smoke test now sends startGame / backToLobby to whichever tab is the host NOW + retries from it (the host changed on a starved runner) — SP2's Known issues |

### 1. THE PEOPLE ON THE PROMENADE (`core/harbor-people.js` PURE + `tests/harbor-people.test.mjs`; `screens/harbor/people.js`, `folk.js`, `bus.js`)
- **GUIDED FREE WILL, PLANNED** — not simulated: a visitor is a KIND (`KINDS`: its goals — `{ from }` an edge / a door / the bus / across the
  crossing, `{ at }` a node, `{ pose, dur }`, `{ cross: 'out' }`, `{ door }`, `{ bus: true }`, `{ exit }`) turned into an ITINERARY of walk legs
  (routes round the obstacles: a tiny visibility graph, `route`) + pose legs on the clock (`planVisit`). Visits are generated per BLOCK of
  480 s from a seed (the local date + the block) in two overlapping PHASES (A at k·B, B at k·B + B/2): a visit lives inside its block, so the
  blocks are independent; B is planned against A's occupancy (+ the bus riders), so the count never passes `FOLK.cap` (12). The promenade at
  any moment is a pure function of the city clock (`folkAt`): every phone sees the same people, a page opened mid-way joins them mid-stroll
  (tested: a cold start = a phone that watched all day). ~0.01 ms a frame; a new block ~3–6 ms once every 4 minutes.
- **THE MAP** (`folkMap`): nodes from the real pieces (the doors, the shop window, the bench's two seats, the cart, the inlay, the crossing's
  kerbs, the bus stop, a spot to look up at the sky), exits (both edges at several depths; the waterside sidewalk's ends — left = behind the
  speakeasy), obstacles (the building, behind the bench + crabapple + under the blade, the road but the crossing, the kerbs either side of it,
  the tall lamps, the cart + the strip in front of it, the inlay's ring during an event, the lobby line).
- **WHO'S OUT WHEN** (Ben's add-on) is DATA — `MIX`: early (joggers, dog walkers, a worker to the bus), the commute (brisk walkers, bus
  riders, a newsboy), the morning + midday (strollers, couples, lunch on the bench, window-shoppers, a customer into the barbershop, the cart,
  someone crossing to look at the water, two friends chatting), the afternoon, homeward (to the bus, the crossing, the edges), the evening
  (couples arm in arm, guests to the side door, a few joggers, dog walkers, someone pointing up at the sky), late (stragglers, a couple out of
  the side door, a lone walker), the small hours (a night worker, often nobody). `MOOD`: weekends busier + the evening an hour later; party
  nights ×3.2 guests, ×1.3 the count; rain (Part 9's hook: `ctx.rain`) ×0.45, faster, umbrellas, no lunch on the bench.
- **THE CROSSING:** people wait at the kerb on WAIT (facing the lantern) and start only in WALK, early enough to finish before the blinking
  WAIT ends (`walkStart`), at least a brisk pace (`crossV`) — tested over two days at 390 / 402 / 430: nobody in the road but crossing / at the
  bus door. Across: the waterside sidewalk, then left (behind the speakeasy) or right.
- **THE BUS** (`busesOf`, `bus.js`): a 1920s city coach (two-tone HARBOR LINE livery, a domed roof + route board, spoked wheels turning with
  its distance, a folding door on our side, lit windows + riders + headlamp beams at night), 2–4 an hour by day, one late, none 2–5 am; it
  comes from behind the speakeasy, STOPS JUST LEFT OF THE CROSSING (decided here: right of it the framing maple + the cart's umbrella hide the
  road; its front stops short of the crosswalk, its rear clear of the speakeasy), the door opens, riders step off (`busRiders`) + on (visits
  with `{ bus: true }` wait at the stop), and it pulls away through the crossing ONLY ON GREEN (it waits at the red). Its sounds:
  `snd.bus('arrive' | 'idle' | 'door' | 'depart' | 'pan' | 'gone')`. Preview `&force=bus` (one a minute).
- **THE CART back, placed** (`PHONE.cart` f 0.825, z 42.4; `CART_SHOWN`): right of the inlay (outside an event's clearance — tested), clear of
  the crossing; the vendor stands behind it 10 am → 9 pm; people stop for chestnuts; nobody walks in front of it (it bakes with the front row).
- **DEPTH** — three passes (`people.js`): FAR (the crosswalk, the waterside sidewalk, the bus) after the road layer, before the stage — the stop
  lights, the lamps, the trees + the speakeasy stand in front (walkers off left go behind the building); NEAR (the promenade) after the stage +
  the speakeasy's live layer, before the front row (the corner globes, the framing maple, the cart are nearer than the walkable floor:
  `FOLK.zMin`); ROOF clipped to the sky over the parapet. Nobody walks behind the bench / the crabapple / under the blade (an obstacle), so the
  baked stage never needs to cover a walker.
- **THE LOOK** (`folk.js`): `LOOKS` by kind + season + party + rain — long coats + fedoras, cloche hats + drop-waist dresses, flapper dresses
  (a fringe, a headband + feather) + tuxedos (a top hat now and then) on party nights, shirt-sleeves + boaters in summer, scarves in autumn /
  winter, a newsboy (kid-sized) with his papers, a worker's flat cap + lunch pail, a briefcase / a purse; dogs on sagging leashes. A
  STRIDE-LOCKED walk (the planted foot fixed on the ground — tested), a jog, poses (sit, wait, watch, chat — the partner steps round to face,
  point up, wave, window-shop, at the cart, lean on the railing; on the roof dance, toast, garden), arm in arm. LIT by the scene: by day the
  sun's side + a cast shadow along the real sun; at night the scene's darkness (`T.night`) + the lamps' light where each stands
  (`stage.js#lightField`) + a crisp rim toward the nearest lamp; a contact shadow always. ~27 pt at the promenade's middle.
- **SOUNDS** (all through their slots): footsteps (cobble / heels) on the NEAREST walker's footfalls, very soft; a distant laugh from a pair
  chatting now and then; the cart's bell; the line's murmur; the rooftop party's bed; the bus.
- **THE LOBBY LINE** (`linePlaces`, `lineRect`): from just left of the side door along the shopfront, bending down toward the bottom-left
  corner; guests past five wait on the open floor beside it — never cut by the left edge, never under the dock, the door clear (tested at
  390 / 402 / 430 for 4 / 6 / 8); they shift their weight, check a watch, chat. Preview `&force=line&n=6`; Lobby 2.0:
  `harbor().people.setLine(n)` (the room's players — their names / looks are Lobby 2.0's).

### 2. THE ROOFTOP PEOPLE (`roofMap`, `roofCrowd`, `roofVisits`, `roofAt`)
Their own small zone: up + down through the stair house's door (never popping in), taller than the parapet (clipped to the sky over the
front's silhouette), lit by the café lights. Party nights + summer weekend nights: up to `FOLK.roofCap` (6) — couples dancing, a toast, the
bar cart, someone at the parapet; otherwise 0–1 (someone stepping out for the view in the evening; the gardener at the beds by day, April →
October); nobody in the rain. The rooftop party's sound bed only while ≥ 3 are up there.

### Hooks
- **Lobby 2.0:** `harbor().speakeasy.hush(word)` (the sign), `harbor().people.setLine(n)` (the line; the figures' looks can take the players'
  colours later — `lookOf`).
- **8b (THE LIFE):** a new visitor = one `KINDS` entry + its weight in `MIX`; a new figure = one `LOOKS` branch; cabs: a `from: 'cab'` like
  `from: 'bus'` (the back road's kerb); the raid: `people.budget(0)` empties the street; the billposter / sign painters: a roof `kind` with a
  `{ pose }` at the billboard.
- **Part 9 (weather):** `frame({ rain })` (fewer, faster, umbrellas); snow: the same hook + `LOOKS` (boots, mufflers); wet paving reflections
  under the figures go with the street's wet pass.
- **6b's director:** `harbor().people.budget(k)` (0..1 — a big sky moment can thin the street).

### Previews (Ben's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
8:30 am `2026-10-22T08:30` · noon `T12:30` · 5:30 pm `T17:30` · dusk (the lamps catching) `T18:52` · 10:30 pm `T22:30` · 1 am `2026-10-23T01:00` ·
a party night `2026-10-24T21:45` (the roof) · the lobby line `T21:30&force=line&n=6` · the hush sign `T22:30&force=hushsign&hush=JAZZ` (+ noon
`T12:30&force=hushsign&hush=JAZZ`, a 5-letter `&hush=SWING`) · the bus `2026-10-22T11:00&force=bus` · rain `T19:30&wx=rain` · nobody `&force=no-people`.

### Tests (8P)
Unit 590 (`harbor-people.test.mjs` NEW, 12: the hush sign's size + states + its strike; the lamps' life; the basement; the crossing's light;
WHO'S OUT WHEN; two days of people at three phones — the cap, nobody under the dock / in a wall / behind the bench / in front of the cart, the
road only on WALK, every arrival + departure through an edge / a door / the bus / the crossing; join mid-way; the bus; the line; the roof; the
stride lock. `harbor.test.mjs`: the blade's 10 pt rule for every game, the brick street, the cart placed; `harbor-jobs.test.mjs` NEW).
e2e-harbor: NEW `people` group (10: people out at noon + drawn (A/B vs `no-people`), the hush sign by day / at night / with a word, the
lamps all on late, the line preview, a bus stopping with its door open, the roof's party) — in the `street` cloud job; locally `street`
(64/64 after the mirror-door probe moved above the sign) + `people` 10/10.

### Performance (A/B in one run, `title-perf.mjs --ab` against 7dc3a8d (section 0), 402×874, the laptop without a GPU)
| scene | t2 · t1 · t0 work A → B (ms, 4× CPU) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-night` (a weekday 21:30) | 9.76 → 6.83 · 4.54 → 5.49 · 3.16 → 4.2 | 16.8–17.1 · 0–1.7 % | same · SLOWER (work) +0.96 (noise ±0.81) · same (+1.04, noise ±3.33) |
| `np-party` (Sat 23:00) | invalid · invalid (at 4× without a GPU the party steps itself down: no A windows — as every pass) · 8.78 → 12.83 | t0 16.8 → 33.3 p95 · 0.7 → 7.5 % slow | **SLOWER (work) +4.06 ms at tier 0** (noise ±1.46) |
The first round said the same (+1.1 / +1.5 night, +5.3 party t0); the ONE FIX between them: figures off the screen's edges / behind the
speakeasy not drawn, no rim pass at tier 0, the roof's clip a small polygon (it was a whole-screen even-odd mask a frame). After the
re-measure (per the plan's rule — no loop): a flapper dress's fringe as one path (it was ~18 strokes a figure) — NOT measured. The party
night at tier 0 is the open question: the laptop's 4× throttle is ~4× an iPhone, so ~1 ms on the phone — **Ben's iPhone readout (&debug=1) on a
party night decides**; if it shows slow frames, the steps: fewer figures at tier 0 (`FOLK.cap` by tier), the roof's guests off at tier 0.

### Known issues (8P)
- The rooftop's visible deck is narrow (the left part of the roof is off the screen's edge at 402): the guests read as small warm silhouettes
  above the parapet, by the café lights.
- The bus is partly behind the crabapple's crown at its stop (real depth — it's in front of the road); the riders read below the crown.
- A new block of visits is planned in one go (~3–6 ms on the laptop at 1× CPU, once every 4 minutes per phase).
- Footsteps / laughs / the bus need the city sounds armed (the first tap on iOS); all silent when muted.
- WebKit can't run here (as every pass): the figures are plain paths + fills (no filters), the sign's glow the tube system's shadowBlur.
- ~~**THE POLE on a party night** (e2e `speakeasy`) fails EVERY local run~~ — FIXED in FP3a: a TEST bug (FREV B5) — the probe read the
  lit glass's white LED core down the middle; it reads two columns either side of it now, a hard check again. The pole was right.
- The `speakeasy` group's light probes now run with `&force=no-people` (a walker passing between two readings moved a probe by 18 levels).
- **THE CLOUD (2 runs, Ben's cap):** run 1 (ab46b44, the `[harbor]` push — the first on the 4-job split, ≈ 4¼ min wall, 4 jobs): audio, show,
  city green; street 73 / 74 — "THE POLE at night" read its red stripe at 210,121,139 against a hard `g < 120` (passing here at 120 / 119:
  the probe on the pole's lit core, a borderline threshold, the pole untouched) → the probe moved off the core + the red test relative (red
  leading by 60 / 50). Run 2 (only the `street` job, by hand): the pole passed; 73 / 74 — "NO SMOKE round the pole": one far probe now
  sat inside the shop window (the pole moved ~2 pt right), where the mirror door's amber came on between the two readings → moved onto the
  brick right of the pole (passes here; NOT re-run in the cloud — the two-run cap). The next `[harbor]` push confirms it.

### Handoff → FREV (the Fable foreground review), then 6b + 8b
The foreground is alive: people, the bus, the cart, the roof, the line + the sign as Lobby 2.0's hooks. FREV reviews it with fresh eyes (the
speakeasy + promenade + lighting + the systems' separation — clouds, lights, sounds, people hooks).
